// This file was automatically generated. Edits will be overwritten

export interface Typegen0 {
  "@@xstate/typegen": true
  eventsCausingActions: {
    setupProject: "xstate.init"
    applyPipeline: "APPLY"
    stopWatcher: "xstate.init"
    openEditor: "READY"
    startWatcher: "READY"
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
      | "stopWatcher"
      | "openEditor"
      | "startWatcher"
      | "syncProject"
    services: never
    guards: never
    delays: never
  }
  eventsCausingServices: {}
  eventsCausingGuards: {}
  eventsCausingDelays: {}
  matchesStates: "setup" | "applying" | "watching" | "syncing"
  tags: never
}
