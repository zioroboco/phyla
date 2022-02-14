import * as os from "os"
import * as path from "path"
import * as sys_fs from "fs"
import { ChildProcessWithoutNullStreams, spawn } from "child_process"
import { TaskInstance, run } from "begat/core"
import { strict as assert } from "assert"
import { createMachine, createSchema, interpret } from "xstate"

export type ServerEvent = {
  type: "APPLY" | "CHANGES" | "READY" | "SYNC"
}

export type ServerContext = {
  editor: ChildProcessWithoutNullStreams | null
}

export type ServerConfig = {
  srcdir: string
  watch: string[]
  exclude: string[]
  tasks: TaskInstance[]
  io: {
    stdout: NodeJS.WritableStream
    stderr: NodeJS.WritableStream
  }
}

export const withConfig = ({ io, ...config }: ServerConfig) => {
  const { stdout, stderr } = io
  const [firstTask, ...nextTasks] = config.tasks
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
              `${config.srcdir}/`,
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
          await run(firstTask, {
            fs: sys_fs,
            cwd: tmpdir,
            pipeline: {
              prev: [],
              next: nextTasks,
            },
          })
            .then(() => {
              instance.send("READY")
            })
            .catch((err: unknown) => {
              throw new Error(`pipeline error:\n\n${err}`)
            })
        },

        openEditor: ({ editor }) => {
          if (editor) return
          editor = spawn("code", ["--new-window", "--wait", tmpdir])
          editor.on("exit", () => process.exit(0))
          editor.on("error", err => {
            throw new Error(`code exited with error: ${err}`)
          })
        },

        startWatching: (context, event) => {
          console.log(`Not implemented: startWatching`)
        },

        stopWatching: (context, event) => {
          console.log(`Not implemented: stopWatching`)
        },
      },
    })
  )

  return instance
}

export const serverMachine =
  /** @xstate-layout N4IgpgJg5mDOIC5SzAJwG5oHQEMAOeANgJ4CWAdlAMQBKAogIIAiAmoqHgPaykAupncuxAAPRAEYATADYskgMwB2SQA5Ji5Uo2KANCGISALAAYsAVjVn58gJyTx0+VekBfF3pQZsAdxy8AxgAWFNQAyiwAcgDCwlw8-ILCYggAtJJmhljSiraK2eIqimbGGnoGCJI28ljGhtIqtpKG8vbSZm4eaJioWL4BwZRUUQASDBEA4nShsdx8AkJIoogpyliKxmZN4puStTabZRIqZljyxjYaxdLS4k7yru4gnt1YsMTk-iFUDAAKPwAybEWcTmiUWyRS2XMMjMNkKGnUdWkhwq1RkhkqVm2VWkqjcj3InAgcGEz2w+CIZEoM3i8ySiHWWAuTXkx1UdQKKhRKXEWHExl2BQxhhUG2yKg6Ty6Pj8QRCNNBC1AyXqaxshhsmrM4n5hnE6pRCmq2SK9xU+w1IslZJ6bw+8uBswSSqWqTOKj5xkc2sKG3k225pjMmy9iluBVhUmD1ulqAVzvpbpanu9BXWWLM3MUmRK1iqUkU+1D+JcQA */
  createMachine({
    context: {
      editor: null,
    },
    tsTypes: {} as import("./server.typegen").Typegen0,
    schema: {
      context: createSchema<ServerContext>(),
      events: createSchema<ServerEvent>(),
    },
    id: "server",
    initial: "syncing",
    states: {
      applying: {
        entry: "applyPipeline",
        on: {
          READY: {
            target: "#server.watching",
          },
        },
      },
      watching: {
        entry: ["openEditor", "startWatching"],
        exit: "stopWatching",
        on: {
          SYNC: {
            target: "#server.syncing",
          },
          CHANGES: {
            target: "#server.watching",
          },
        },
      },
      syncing: {
        entry: "syncProject",
        on: {
          APPLY: {
            target: "#server.applying",
          },
        },
      },
    },
  })
