<header>
  <div align="center">
    <h1>
      <p>🧬</p>
      <p>phyla</p>
    </h1>
    <p>Create families of composable project (re-) generators.</p>
    <a href="https://www.npmjs.com/package/@phyla/core">
      <img src="https://img.shields.io/npm/v/@phyla/core?style=flat-square">
    </a>
  </div>
  <br/>
</header>

## Overview

Phyla is a framework for distributed project templating and maintenance.

It is designed to allow groups of people to create families of related tasks which build upon each other and their well-typed common config.

Pipelines are intended to be run _continuously_ as updates are pushed to task packages, and as a check against unexpected changes which could have been contributed to the wider ecosystem.

It's WIP and subject to breaking changes, but it's definitely useable.

## Principles

  - optimise for writing, testing and scalably composing tasks
  - make use of npm packages / package registries
  - use only minimal dependencies
  - 100% ESM

## Running pipelines

```sh
# show commands and their options
npm run phyla

# write changes directly to the filesystem
npm run phyla write ./path/to/project

# diff the filesystem and exit non-zero on changes
npm run phyla diff ./path/to/project

# start a development server (requires vscode)
npm run phyla dev ./path/to/project --watch ./path/to/task
```

## Configuring pipelines

```js
// ./phyla.mjs

import { pipeline } from "@phyla/core"

export default pipeline({
  tasks: [
    import("@phyla/some-contributed-task"),
    import("./tasks/my-local-task.mjs"),
  ],
  parameters: {
    author: {
      name: "Raymond Luxury-Yacht",
      email: "rayly@example.com",
    },
  },
})
```

## Authoring tasks

```ts
// ./tasks/my-local-task.mjs

import { task } from "@phyla/core"
import expect from "expect"

type MyTaskParameters = {
  // ...
}

export default task((params: MyTaskParameters) => ({

  pre: ({ describe, it }, { cwd, fs }) => [
    it(`meets the pre-conditions of the task`, () => {
      expect(...)
    }),
  ],

  run: async function ({ cwd, fs }) {
    // do useful work with the provided fs module...
  },

  post: ({ describe, it }, { cwd, fs }) => [
    it(`has been completed successfully`, () => {
      expect(...)
    }),
  ],

}))
```
