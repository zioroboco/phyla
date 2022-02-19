---
"@phyla/core": minor
---

Add task definition function.

```ts
export type Options = { ... }

export default task((options: Options) => ({
  pre: ({ describe, it }) => ctx => [
    ...
  ],

  run: async ctx => {
    ...
  },

  post: ({ describe, it }) => ctx => [
    ...
  ],
}))
```
