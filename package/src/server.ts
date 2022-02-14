import { TaskInstance, run } from "begat/core"
import { createMachine, createSchema, interpret } from "xstate"

export type ServerEvent = {
  type: "APPLY" | "CHANGES" | "READY" | "SYNC"
}

export type ServerContext = {}

export type ServerConfig = {
  srcdir: string
  workdir: string
  watch: string[]
  excludes: string[]
  tasks: TaskInstance[]
}

export const withConfig = (config: ServerConfig) => {
  const excludeArgs = [".git/", "node_modules/"]
    .concat(config.excludes ?? [])
    .map(p => `--exclude ${p}`)
    .join(" ")

  const [firstTask, ...nextTasks] = config.tasks

  return interpret(
    serverMachine.withConfig({
      actions: {
        syncProject: async (context, event) => {
          // spawn child process
        },

        applyPipeline: async (context, event) => {
          await run(firstTask, {
            fs: await import("fs"),
            cwd: config.workdir,
            pipeline: {
              prev: [],
              next: nextTasks,
            },
          })
        },

        openEditor: (context, event) => {
          console.log(`Not implemented: openEditor`)
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
}

export const serverMachine =
  /** @xstate-layout N4IgpgJg5mDOIC5SzAJwG5oHQEMAOeANgJ4CWAdlAMQBKAogIIAiAmoqHgPaykAupncuxAAPRAEYATADYskgMwB2SQA5Ji5Uo2KANCGISALAAYsAVjVn58gJyTx0+VekBfF3pQZsAdxy8AxgAWFNQAyiwAcgDCwlw8-ILCYggAtJJmhljSiraK2eIqimbGGnoGCJI28ljGhtIqtpKG8vbSZm4eaJioWL4BwZRUUQASDBEA4nShsdx8AkJIoogpyliKxmZN4puStTabZRIqZljyxjYaxdLS4k7yru4gnt1YsMTk-iFUDAAKPwAybEWcTmiUWyRS2XMMjMNkKGnUdWkhwq1RkhkqVm2VWkqjcj3InAgcGEz2w+CIZEoM3i8ySiHWWAuTXkx1UdQKKhRKXEWHExl2BQxhhUG2yKg6Ty6Pj8QRCNNBC1AyXqaxshhsmrM4n5hnE6pRCmq2SK9xU+w1IslZJ6bw+8uBswSSqWqTOKj5xkc2sKG3k225pjMmy9iluBVhUmD1ulqAVzvpbpanu9BXWWLM3MUmRK1iqUkU+1D+JcQA */
  createMachine({
    context: {},
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
