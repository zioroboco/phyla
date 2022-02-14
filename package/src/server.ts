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

export type ServerConfig = {
  getTasks: (dir: string) => Promise<TaskInstance[]>
  srcdir: string
  watch: string[]
  exclude: string[]
  io: {
    stdout: NodeJS.WritableStream
    stderr: NodeJS.WritableStream
  }
}

export const withConfig = ({ io, srcdir, ...config }: ServerConfig) => {
  const { stdout, stderr } = io
  const tmpdir = path.join(os.tmpdir(), "begat")

  const instance = interpret(
    serverMachine.withConfig({
      actions: {
        syncProject: async () => {
          await new Promise<number>((res, rej) => {
            const rsync = spawn("rsync", [
              "--archive",
              "--checksum",
              "--delete",
              "--inplace",
              `${srcdir}/`,
              `${tmpdir}/`,
              ...[".git/", ...config.exclude].flatMap(p => ["--exclude", p]),
            ])
            rsync.stdout.pipe(stdout),
            rsync.stderr.pipe(stderr),
            rsync.on("error", rej)
            rsync.on("exit", code => {
              assert(code != null)
              code > 0 ? rej(code) : res(code)
            })
          })
            .then(() => {
              instance.send("APPLY")
            })
            .catch((code: unknown) => {
              throw new Error(`rsync exited ${code}`)
            })
        },

        applyPipeline: async () => {
          await new Promise((res, rej) => {
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
              instance.send("READY")
            })
            .catch((code: unknown) => {
              throw new Error(`worker exited ${code}`)
            })
        },

        openEditor: context => {
          if (context.editor) return
          context.editor = spawn("code", ["--new-window", "--wait", tmpdir])
          context.editor.on("exit", () => process.exit(0))
          context.editor.on("error", err => {
            throw new Error(`code exited with error: ${err}`)
          })
        },

        startWatching: context => {
          if (!Array.isArray(context.watchers)) {
            context.watchers = []
            for (const dir of [srcdir, ...config.watch]) {
              console.debug(`  - watching ${path.resolve(dir)}`)
              context.watchers.push(
                system_fs.watch(path.resolve(dir), { recursive: true })
              )
            }
          }
          for (const watcher of context.watchers) {
            watcher.addListener("change", () => instance.send("SYNC"))
          }
        },

        stopWatching: context => {
          assert(Array.isArray(context.watchers))
          for (const watcher of context.watchers) {
            watcher.removeAllListeners()
          }
        },
      },
    })
  )

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
