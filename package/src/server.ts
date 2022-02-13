import { createMachine, createSchema } from "xstate"

export type ServerContext = {}

export type ServerEvent = {
  type: "APPLY" | "CHANGES" | "READY" | "RESET" | "SYNC"
}

export const serverMachine =
  /** @xstate-layout N4IgpgJg5mDOIC5SzAJwG5oHQEsB2OALjgIYA2Os+UAxAIIAKDAMgJqKgAOA9lcd3g4gAHogCMAJgAcWAGwBWKQGYAnBIAMUgOxSALFq0AaEAE9EAWjHr1WK7Nkr1SpVvXyxYgL6fjKDNhJOTjITahoAJQBROgARdiQQHj4cASFRBElZLAkXaQkDHIMDYzMM3RtFCXlnNTFZJWrZb180TFQsAHcSQgBjAAswgGVWADkAYSEkohTBBPTzKt05LVUtWS0xbXl1YtNECRUlLHVdWWU1XSUJOvlmkD82zu7+sLGACToRgHFIwcneaapOYWLQSLCueQSXRiSEaXQqSElcRSeRYJTqFQGbb2MQNJRNHz3VrYWAmPA9MKMFjxLgA-izUDzdZYSEKFTaApaU6yJEIHLZWS6A7VGGHWTSbyEvDcCBwIQPbD4abkSjUf7JIGMxBc2wGewaeTi+r6XkLaHg+Rc-TrYWyTZ3BXtQLBUJ4KDqwEMkTamyYqFKFHSU6bKSmsS2dQaTZC3RSNzrKQO4ntLq9AZuj30tKIM7glTwlQIjwnMT53k5I7rLSNKQI+GxpP+dqk8lqhJTLPAhDmdEyOwNTYQpQw00VSHqda4zbyFSSeS3QmOzMzbPd5xg-vubRuYfyU3DpagqRSCSFO3qDwE7xAA */
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
