// This file was automatically generated. Edits will be overwritten

export interface Typegen0 {
  "@@xstate/typegen": true
  eventsCausingActions: {
    spawnWatchers: "xstate.init"
    initialiseProject: "xstate.init"
    applyPipeline: "APPLY"
    stopWatchers: "xstate.init"
    resetProject: "RESET"
    openEditor: "READY"
    startWatchers: "READY"
    syncProject: "SYNC"
  }
  internalEvents: {
    "xstate.init": { type: "xstate.init" }
  }
  invokeSrcNameMap: {}
  missingImplementations: {
    actions:
      | "spawnWatchers"
      | "initialiseProject"
      | "applyPipeline"
      | "resetProject"
      | "openEditor"
      | "syncProject"
    services: never
    guards: never
    delays: never
  }
  eventsCausingServices: {}
  eventsCausingGuards: {}
  eventsCausingDelays: {}
  matchesStates:
    | "initialising"
    | "applying"
    | "watching"
    | "syncing"
    | "resetting"
  tags: never
}
export interface Typegen1 {
  "@@xstate/typegen": true
  eventsCausingActions: {}
  internalEvents: {
    "xstate.init": { type: "xstate.init" }
  }
  invokeSrcNameMap: {}
  missingImplementations: {
    actions: never
    services: never
    guards: never
    delays: never
  }
  eventsCausingServices: {}
  eventsCausingGuards: {}
  eventsCausingDelays: {}
  matchesStates: "waiting" | "watching"
  tags: never
}
