import { createMachine, createSchema } from "xstate"

export type ServerContext = {}

export type ServerEvent = {
  type: "APPLY" | "CHANGES" | "READY" | "SYNC"
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
