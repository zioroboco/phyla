import * as os from "os"
import * as path from "path"
import * as system_fs from "fs"
import { ChildProcessWithoutNullStreams, spawn } from "child_process"
import { strict as assert } from "assert"
import { fileURLToPath } from "url"

import { createMachine, createSchema, interpret } from "xstate"

import { TaskInstance } from "./core.js"

/**
 * Duration for which file watcher events will be buffered -- i.e. for any two
 * changes, if the second arrives within this period, the first is ignored.
 */
const RESYNC_BUFFER_MILLIS = 200

export type ServerEvent = {
  type: "APPLY" | "READY" | "RESYNC"
}

export type ServerContext = {
  editor?: ChildProcessWithoutNullStreams
  watchers?: system_fs.FSWatcher[]
  timer?: Date
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

  const tmpdir = path.join(os.tmpdir(), "phyla", path.basename(srcdir))

  log.debug({ srcdir, tmpdir, config })

  const instance = interpret(
    serverMachine.withConfig({
      actions: {
        syncProject: async context => {
          context.timer = new Date()
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

        applyPipeline: async context => {
          await new Promise((res, rej) => {
            log.debug("forking worker")
            const workerModule = path.join(
              path.dirname(fileURLToPath(import.meta.url)),
              "../bin/worker.mjs"
            )

            const worker = spawn(workerModule, [srcdir, tmpdir], {
              stdio: "inherit",
            })

            worker.on("exit", (code: number) => {
              assert(code != null)
              code > 0 ? rej(code) : res(code)
            })

            worker.on("error", rej)
          })
            .then(() => {
              log.debug("worker finished")
              instance.send("READY")
              assert(context.timer)
              const buildtime =
                new Date().getTime() - context.timer.getTime()
              log.info(`ready in ${(buildtime) / 1000}s`)
              log.debug(`${RESYNC_BUFFER_MILLIS / 1000}s buffer`)
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
          let timeout: NodeJS.Timeout | undefined
          function requestSync () {
            if (timeout) clearTimeout(timeout)
            timeout = setTimeout(() => {
              log.info() // erate newline on resync
              instance.send("RESYNC")
            }, RESYNC_BUFFER_MILLIS)
          }

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
            watcher.addListener("change", requestSync)
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
  /** @xstate-layout N4IgpgJg5mDOIC5SzAJwG5oHQEMAOeANgJ4CWAdlAPp6l5iEVgDEASgKICCAIgJqKg8Ae1ikALqSHkBIAB6IALAHYlWAKwBGAMxaNGgExL9WgBxqTANgA0IYon16sChQE41a5wp1qXpgL5+NigY2ADuOGIAxgAWFNQAZkKoVDE4lHBs7ADKvAByAMIywqISUjLyCMqqmjp6hsZmljZ2CEpqWC4uCvq+DvomLgAMFhoBQWiYqFiwxOSRcTSoQgBWYJFizJwAClsAMvxIIMXiktKHFfqDg04agwZqSlr63RomJs32js5uHs7eviYAoEQOQhBA4DJgpNcAQSAtaPRGOQwEURCcyudELp2goLPp8QoTLiLINcR8EJctFgNAo1E8LCMtCNGWMQFCwhEYgtEslUul4IdjqUzqAKiSLFgTLcND4FNoTHdrLZEDKXFglC4lGYtLihkS3qz2VMZnN4UtVutUSVTuVFPpya81Z0tA9+ko7voLA9DRM0Fb0SK5Cr3sqEFTBviXBo3BYlLSXdoFEC-EA */
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
          RESYNC: {
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
