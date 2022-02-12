import { Actor, createMachine, createSchema } from "xstate"

export type FSEvent = {
  type: "add" | "addDir" | "change" | "unlink" | "unlinkDir"
  path: string
}

export type WatcherContext = { events: FSEvent[] }
export type WatcherEvent = { type: "START" | "STOP", }

export type Watcher = Actor<WatcherContext, WatcherEvent>

export const serverActions = [
  "applyPipeline",
  "initialiseProject",
  "openEditor",
  "resetProject",
  "spawnWatchers",
  "startWatchers",
  "stopWatchers",
  "syncProject",
] as const

export type ServerActions = {
  type: typeof serverActions[number]
}

export type ServerContext = { watchers: Watcher[] }
export type ServerEvent = { type: "APPLY" | "READY" | "RESET" | "SYNC" }

export type ServerConfig = Parameters<typeof serverMachine.withConfig>[0]

export const serverMachine =
/** @xstate-layout N4IgpgJg5mDOIC5SzAJwG5oHQEsB2OALjgIYA2Os+UAxAIIAKDAMgJqKgAOA9lcd3g4gAHogCMAJgAcWAGwBWKQGYAnBIAMUgOxSALFq0AaEAE9EAWjHr1WK7Nkr1SpVvXyxYgL6fjKDNhJOTjITahoAJQBROgARdiQQHj4cASFRBElZLCVdKXkVJXklJy1dZ2MzDK0xLAlpdQLZMS15CRVS7180TFQsAHcSQgBjAAswgGVWADkAYSEkohTBBPTzCXldLFz7eQ2DCR1pCsQXeS3ZJTEVZrd9bc6QPx7+wdGwqPHIgBV53kXUlYWWSbJrVBRqWRSdoSMTHBCXGpXTSOZoedSlLQPJ7YWAmPBDMKMFjxLh-fjLUCrexydFXFS6MRSCTFexwyw1YE5FT2JyKYpOLHdbCoOBgQjEPC0IlsX7JAGUoFKbKteRadYKKyaKRw2Q2XTtBpifV6Zy6CTeHwgPDcCBwITY3r4RbkSjUWX-CkiRAXLAQlT06Qwpm6+Rs6SbXS7KTR2QGFSKFSC-y9QLBUKS93ktKIVy+tVlPLhprRtmI9QaRlm3JuWNSJPPAbDMYZhILLOAhC54rR-RWNryByh0yINpaX1XLRKcGxhTM+s4vEElukuWe1bd2zqC7ubRuS5DyrmGy7DSxsSXPLXdbyee9EUocVu1tkpbZhDsrLrOPrdSRyHAuExFaLBo0KUEGSUCQHCUW9M1fDtzGcCRN23RlXCKIC2UKMczTVSc3HLXRZAtTwgA */
createMachine({
  context: { watchers: [] },
  tsTypes: {} as import("./services.typegen").Typegen0,
  schema: {
    actions: createSchema<ServerActions>(),
    context: createSchema<ServerContext>(),
    events: createSchema<ServerEvent>(),
  },
  id: "server",
  initial: "initialising",
  states: {
    initialising: {
      entry: ["spawnWatchers", "initialiseProject"],
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
      entry: ["openEditor", "startWatchers"],
      exit: ["stopWatchers", "resetProject"],
      on: {
        SYNC: {
          target: "#server.syncing",
        },
        RESET: {
          target: "#server.resetting",
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
    resetting: {
      entry: "resetProject",
      on: {
        APPLY: {
          target: "#server.applying",
        },
      },
    },
  },
})

export const watcherMachine =
/** @xstate-layout N4IgpgJg5mDOIC5QHcCGAXAxgCzAJwDo0BLdYgOygGIBlAFQEEAlOxUABwHtZTjPy2IAB6IAjKICsBAOyiAbAE4AzABYAHArlq1EgEwAaEAE8x03QQlqlugAxaJK3RKU2VAXzeG0WXIW84KanoAeQAFQS4eMn5BEQRRJQIbaR0bGzVdORVZCVEFQxN4swIVPJ0FFRtdFQU1OV0PTxByTgg4QX9fIlReSgjuXhikYUQVORlRNOk5UR16lKUCxDVpCwkZ3UklNRsXWo8vDBx8bp9A-qi+AWG4xwIFG1zpaQVM1w01JYRMxIkJG1E0lKrzkuXcTU6+Aug2uoDiAFpJvdNjUFIClHo1OpRF9RCoLFjpHpqlUNEpyY03EA */
createMachine({
  context: { events: [] },
  tsTypes: {} as import("./services.typegen").Typegen1,
  schema: {
    context: createSchema<WatcherContext>(),
    events: createSchema<WatcherEvent>(),
  },
  id: "watcher",
  initial: "waiting",
  states: {
    waiting: {
      on: {
        START: {
          target: "#watcher.watching",
        },
      },
    },
    watching: {
      on: {
        STOP: {
          target: "#watcher.waiting",
        },
      },
    },
  },
})
