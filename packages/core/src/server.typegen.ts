// This file was automatically generated. Edits will be overwritten

export interface Typegen0 {
  "@@xstate/typegen": true
  eventsCausingActions: {
    applyPipeline: "APPLY"
    stopWatching: "xstate.init"
    openEditor: "READY"
    startWatching: "READY"
    syncProject: "RESYNC"
  }
  internalEvents: {
    "xstate.init": { type: "xstate.init" }
  }
  invokeSrcNameMap: {}
  missingImplementations: {
    actions:
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
  matchesStates:
    | "applying_pipeline"
    | "watching_for_changes"
    | "syncing_project"
  tags: never
}
