import * as os from "os"
import * as path from "path"
import * as system_fs from "fs"
import { ChildProcessWithoutNullStreams, fork, spawn } from "child_process"
import { TaskInstance } from "begat/core"
import { strict as assert } from "assert"
import { createMachine, createSchema, interpret } from "xstate"
import { fileURLToPath } from "url"

export type ServerEvent = {
  type: "APPLY" | "READY" | "SYNC"
}

export type ServerContext = {
  editor?: ChildProcessWithoutNullStreams
  watchers?: system_fs.FSWatcher[]
}

export type Logger = {
  debug: (...args: any[]) => void
  info: (...args: any[]) => void
  warn: (...args: any[]) => void
  header: (...args: any[]) => void
  serverinfo: string
  verbose: boolean
}

export type ServerConfig = {
  getTasks: (dir: string) => Promise<TaskInstance[]>
  srcdir: string
  watch: string[]
  exclude: string[]
  log: Logger
  io: {
    stdout: NodeJS.WritableStream
    stderr: NodeJS.WritableStream
  }
}

export const withConfig = ({ io, log, srcdir, ...config }: ServerConfig) => {
  log.debug("creating server instance")
  log.header(log.serverinfo, "\n")

  const tmpdir = path.join(os.tmpdir(), "begat")

  log.debug({ srcdir, tmpdir, config })

  const instance = interpret(
    serverMachine.withConfig({
      actions: {
        syncProject: async () => {
          await new Promise<number>((res, rej) => {
            log.debug("spawning rsync process:\n")
            const rsync = spawn(
              "rsync",
              [
                "--archive",
                "--checksum",
                "--delete",
                "--inplace",
                `${srcdir}/`,
                `${tmpdir}/`,
                ...[".git/", ...config.exclude].flatMap(p => ["--exclude", p]),
                ...(log.verbose ? ["--verbose"] : []),
              ],
              { stdio: "inherit" }
            )
            rsync.on("error", rej)
            rsync.on("exit", code => {
              assert(code != null)
              code > 0 ? rej(code) : res(code)
            })
          })
            .then(() => {
              log.debug("\nrsync finished")
              instance.send("APPLY")
            })
            .catch((code: unknown) => {
              throw new Error(`rsync exited ${code}`)
            })
        },

        applyPipeline: async () => {
          await new Promise((res, rej) => {
            log.debug("forking worker")
            const workerModule = path.join(
              path.dirname(fileURLToPath(import.meta.url)),
              "../bin/worker.mjs"
            )

            const child = fork(workerModule, {
              env: { srcdir, tmpdir },
            })

            child.on("exit", (code: number) => {
              assert(code != null)
              code > 0 ? rej(code) : res(code)
            })

            child.on("error", rej)
          })
            .then(() => {
              log.debug("worker finished")
              instance.send("READY")
            })
            .catch((code: unknown) => {
              throw new Error(`worker exited ${code}`)
            })
        },

        openEditor: context => {
          if (context.editor) return
          log.debug(`opening editor`)
          context.editor = spawn("code", ["--new-window", "--wait", tmpdir])
          context.editor.on("exit", () => process.exit(0))
          context.editor.on("error", err => {
            throw new Error(`code exited with error: ${err}`)
          })
        },

        startWatching: context => {
          if (!Array.isArray(context.watchers)) {
            log.info(`creating watchers:`)
            context.watchers = []
            for (const dir of [srcdir, ...config.watch]) {
              log.info(`  - watching ${path.resolve(dir)}`)
              context.watchers.push(
                system_fs.watch(path.resolve(dir), { recursive: true })
              )
            }
          }

          log.debug(`subscribing watchers`)
          for (const watcher of context.watchers) {
            watcher.addListener("change", () => instance.send("SYNC"))
          }
        },

        stopWatching: context => {
          log.debug(`unsubscribing watchers`)
          assert(Array.isArray(context.watchers))
          for (const watcher of context.watchers) {
            watcher.removeAllListeners()
          }
        },
      },
    })
  )

  instance.subscribe(state => {
    log.info(`${String(state.value).replaceAll("_", " ")}...`)
  })

  return instance
}

export const serverMachine =
  /** @xstate-layout N4IgpgJg5mDOIC5SzAJwG5oHQEMAOeANgJ4CWAdlAPp6l5iEVgDEASgKICCAIgJqKg8Ae1ikALqSHkBIAB6IAjACYAbFiUBmAOxKAHEq07thrQBoQxRQBYADFgCs++xo0BOJQpUbnKgL6-zFAxsAHccMQBjAAsKagAzIVQqaJxKOGYAZV4AOQBhGWFRCSkZeQQAWiV7KywVLTctOoVdLXsbQ3NLBCVXDSwbKxVdNyUrDQ8Ve39AtExULDDImMoqBKSUtNhmXIAJTmyAcXYMgpFxSWkkOURynSwtG3tRhSelAdcnzsVdeywNG1chjaKhUCm8Gj8ARAQTmWFgxHIEViNFQQgAVmAImJmJwAAq4gAy-CuhXOJSuZXKdQcqnsrhahgMgxUX26fVUVh6zhevRUen8UPIQggcBkMOw+CIZBWtHojHIYFORQupUQDywgNGGh+ekGzV0rPKCiwChsb2anKsukedV002hs1C4WiyLWySiqRg8BJZ2Kl1AZRUNUcWha9nsCjBoINFkQmj6Q3azQUHxsNiDdqh4vm8MRyLwqIxWKVZP91wq-10JvT3maD259kNdnDbyaGmadOU4ft2ZLftVFfG1a8EZaj3bjdjFS0NXaLlBVg+WkjHgFviAA */
  createMachine({
    context: {},
    tsTypes: {} as import("./server.typegen").Typegen0,
    schema: {
      context: createSchema<ServerContext>(),
      events: createSchema<ServerEvent>(),
    },
    id: "server",
    initial: "syncing_project",
    states: {
      applying_pipeline: {
        entry: "applyPipeline",
        on: {
          READY: {
            target: "#server.watching_for_changes",
          },
        },
      },
      watching_for_changes: {
        entry: ["openEditor", "startWatching"],
        exit: "stopWatching",
        on: {
          SYNC: {
            target: "#server.syncing_project",
          },
        },
      },
      syncing_project: {
        entry: "syncProject",
        on: {
          APPLY: {
            target: "#server.applying_pipeline",
          },
        },
      },
    },
  })
