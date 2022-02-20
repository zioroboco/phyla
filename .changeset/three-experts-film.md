---
"@phyla/core": minor
---

Import task modules directly in the pipeline config. Tasks are expected to be found on the module's default export (for now).

```ts
export default config({
  pipeline: [
    import("some-task-module"),
  ],
  parameters: {
    // ...
  },
})
```
