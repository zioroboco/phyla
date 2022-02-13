import { createMachine, createSchema } from "xstate"

export type ServerContext = {}

export type ServerEvent = { type: "APPLY" | "READY" | "RESET" | "SYNC" }

export const serverMachine =
  /** @xstate-layout N4IgpgJg5mDOIC5SzAJwG5oHQEsB2OALjgIYA2Os+UAxAIIAKDAMgJqKgAOA9lcd3g4gAHogCMAJgAcWAGwBWKQGYAnBIAMUgOxSALFq0AaEAE9EAWjHr1WK7Nkr1SpVvXyxYgL6fjKDNhJOTjITahoAJQBROgARdiQQHj4cASFRBElZLAkXaQkDHIMDYzMM3RtFCXlnNTFZJWrZb180TFQsAHcSQgBjAAswgGVWADkAYSEkohTBBPTzKt05LVUtWS0xbXl1YtNECRUlLHVdWWU1XSUJOvlmkD82rFgTPB6wxhZ4rl5p1LmLdZYeQSBQqbQFLSnWQlfZHEG6A7VMTyQ6yaTeHwgPDcCBwIQPbD4abkSjUSY-fizUDpSG2Az2DTyNH1fQwhALXRiLBaeSQ-TrRGyTZ3AntQLBUJ4KDk5J-amIVxYFRaCSXKTAvRCqRSNmWWzqDSbBG6KRudZSEWtbBdXoDKUy35UkSIM7clS6FSe9xWTnutk5I7rHlKM4qeQek2W-ztZ6vMkJKaUtIWJSafX1dzaNxKZG6irA9TrMQ59UqSTyW6Y0UOpP-dnOCTphqbVxI+S6nNLFXaurKwvKvQYzxAA */
  createMachine({
    context: {},
    tsTypes: {} as import("./server.typegen").Typegen0,
    schema: {
      context: createSchema<ServerContext>(),
      events: createSchema<ServerEvent>(),
    },
    id: "server",
    initial: "initialising",
    states: {
      initialising: {
        entry: "setupProject",
        on: {
          APPLY: {
            target: "#server.applying",
          },
        },
      },
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
