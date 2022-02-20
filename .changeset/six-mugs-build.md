---
"@phyla/core": minor
---

Add task definition function.

```ts
export type Parameters = { ... }

export default task((params: Parameters) => ({
  pre: ({ describe, it }, ctx) => [
    ...
  ],

  run: async ctx => {
    ...
  },

  post: ({ describe, it }, ctx) => [
    ...
  ],
}))
```
