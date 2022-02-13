// This file was automatically generated. Edits will be overwritten

export interface Typegen0 {
  "@@xstate/typegen": true
  eventsCausingActions: {
    setupProject: "xstate.init"
    applyPipeline: "APPLY"
    stopWatching: "xstate.init"
    openEditor: "READY"
    startWatching: "READY"
    syncProject: "SYNC"
  }
  internalEvents: {
    "xstate.init": { type: "xstate.init" }
  }
  invokeSrcNameMap: {}
  missingImplementations: {
    actions:
      | "setupProject"
      | "applyPipeline"
      | "stopWatching"
      | "openEditor"
      | "startWatching"
      | "syncProject"
    services: never
    guards: never
    delays: never
  }
  eventsCausingServices: {}
  eventsCausingGuards: {}
  eventsCausingDelays: {}
  matchesStates: "initialising" | "applying" | "watching" | "syncing"
  tags: never
}
