<header>
  <div align="center">
    <h1>
      <p>🧬</p>
      <p>phyla</p>
    </h1>
    <p>A framework for distributed project generation and maintenance</p>
    <a href="https://www.npmjs.com/package/@phyla/core">
      <img src="https://img.shields.io/npm/v/@phyla/core?style=flat-square">
    </a>
  </div>
  <br/>
</header>

## Overview

Project templating is easy. Maintaining a distributed codebase is hard. 

Phyla is a framework for developing, testing and continuously re-applying hierarchies of project generators, which build upon each other and your ever-evolving type-safe common config.

## Principles

  - templating and maintenance deserves a better developer experience
  - generator outcomes should be well-tested and composable
  - updates can be pushed asynchronously via packages
  - node, typescript and esm are the right tools for the job

## Concepts

Phyla is designed around composable **pipelines** and **tasks**, which can optionally include **suites of assertions**.

### Tasks

Phyla tasks are discrete pipeline steps which do useful work.

Tasks are as strict or as lax as you like. They can operate entirely on an injected in-memory `fs` module, or go wild and fire ze missiles with shell scripts written with [google/zx](https://github.com/google/zx) or whatever else.

Note that phyla tasks and pipelines are **always the default export of an es-module**. This narrows the API to make breaking changes harder (and maintenance of pipelines via package updates therefore easier).

```ts
import * as phyla from "@phyla/core"

type TaskParams = { /* inputs to this task */ }

export default phyla.task((params: TaskParams) => ({
  pre: ({ describe, it }, { cwd, fs }) => [
    // check assumptions and pre-conditions...
  ],
  run: async function ({ cwd, fs }) {
    // do the actual work...
  },
  post: ({ describe, it }, { cwd, fs }) => [
    // verify that the work was successful...
  ],
}))
```

### Assertions

Tasks can also host detailed pre- and post- execution assertion suites, to validate both the expectations that the task has of a project, and to verify that the expected outcomes of the task have been achieved.

The assertions API is structured to achieve the greatest possible concurrency, with IO-bound setup steps able to block only the particular tests which depend on that data.

```ts
  post: ({ describe, it }, { cwd, fs }) => [
    describe(`the package.json file`)
      .setup(async () => ({
        packageJson: await readJson(join(cwd, "package.json")),
      })
      .assert(({ packageJson }) => [
        it(`includes the repository details`, () => {
          expect(packageJson).toMatchObject({
            repository: {
              type: `git`,
              url: `https://github.com/${params.org}/${params.project}.git`,
              directory: `packages/${params.package}`,
            }
          })
        })
      ]),
  ],
```

### Pipelines

Pipelines are phyla's unit of composition. Not only can they be used to chain sequences of tasks, but even other pipelines.

```ts
import * as phyla from "@phyla/core"

export default phyla.pipeline({
  tasks: [
    import("@org/some-task"),
    import("@org/an-entire-pipeline"),
    import("@org/pipelines-of-pipelines/oh-my"),
  ],
  parameters: {
    project: "event-log-stream-dispatch-agent-mk2",
    channel: "#glitter-and-chaos",
    environments: ["production", "hyper-production"],
    tags: ["wildly-important"],
  },
})
```

The type of a pipeline's parameters is inferred from the union of the parameters of all the pipeline's constituent tasks.

Like tasks, pipelines can also be defined as a function of exposed parameters, which can then be used to create new abstractions by encapsulating other tasks or pipelines.

```ts
import * as phyla from "@phyla/core"

type ExposedParams = {
  materials: Array<"cardboard" | "string" | "cellophane-tape">
}

export default phyla.pipeline((params: ExposedParams) => ({
  tasks: [
    import("@org/important-business"),
  ],
  parameters: {
    materials: ["paddle-pop-sticks", "pva", ...params.materials],
  },
}))
```

## Commands

While pipelines can also be run programmatically, a CLI client is included in the `@phyla/core` package. Run `phyla --help` for commands and options.

All commands expect a path to a directory with a pipeline exported as the default export of a `phyla.mjs` module (defaulting to the current working directory if no path is provided).

### `phyla write [project]`

Run the pipeline in-place and write changes immediately to disk. This can be destructive, so you want to have a clean work tree, and maybe run `phyla diff` first.

### `phyla diff [project]`

Diff the pipeline against the current state of the filesystem, exiting non-zero on any required changes, or on failing pre- or post-task assertions.

Uses your git pager by default. Add the `--ci` flag for use in CI environments.

```patch
--- a/.../project/package.json
+++ b/.../project/package.json
@@ -1,11 +1,12 @@
 {
   "name": "@phyla/example-project",
   "version": "0.0.0",
-  "author": "Ray",
+  "author": "Raymond Luxury-Yacht <rayly@example.com>",
   "private": true,
   "dependencies": {
     ...
   }
 }
```

### `phyla dev [project]`

Play with the pipeline output via a hot-reloading dev server (oh yes!)

Automatically watches the project directory, but you can add (multiple) `--watch [path]` arguments to watch task directories as well, and `--exclude [path]` directories to prevent syncing heavy directories like `node_modules`.

WIP and experimental, but it works well.

## Where to next?

There's a working example project in the [`./examples/`](https://github.com/zioroboco/phyla/tree/master/examples) directory.

## Contributing

Contributions and ideas are sincerely welcome! ❤️
