<header>
  <div align="center">
    <h1>
      <p>📖</p>
      <p>begat</p>
    </h1>
    <p>Build families of composable project (re-)generators.</p>
    <a href="https://www.npmjs.com/package/begat">
      <img src="https://img.shields.io/npm/v/begat?style=flat-square">
    </a>
  </div>
  <br/>
</header>

- [Usage](#usage)
  - [`pipeline`](#pipeline)
  - [`compose`](#compose)
- [Types](#types)
  - [`Context`](#context)
  - [`Generator`](#generator)
  - [`Options`](#options)
- [Standard library](#standard-library)
  - [`begat/std/clone` (generator)](#begatstdclone-generator)
  - [`begat/std/template` (generator)](#begatstdtemplate-generator)
  - [`begat/std/aside` (generator)](#begatstdaside-generator)
  - [`begat/std/diff`](#begatstddiff)
  - [`begat/std/write`](#begatstdwrite)

## Usage

### `pipeline`

The happy path, presenting a series of dotchained functions, e.g.:

```js
import * as begat from "begat"

begat
  .pipeline([ /* a pipeline of generator functions */ ])
  .withOptions({ /* the union of options for the composed generators */ })
  .then( /* apply the result using the regular promises API */ )
```

### `compose`

Composes a pipeline of generators into... (you guessed it)...

```ts
(generators: Generator[]) => Generator
```

```js
import * as begat from "begat"

const pipeline = begat.compose([ /* a pipeline of generator functions */ ])
const run = pipeline({ /* the union of options for the composed generators */ })

run( /* use the default context, or create one explicitly */ )
  .then( /* apply the result */ )
```

## Types

### `Context`

A chunk of state that gets passed down the pipeline of generators.

Notably includes a [memfs](https://github.com/streamich/memfs) volume.

### `Generator`

```ts
(options?: Options) => Context => Promise<Context>
```

Takes some options, and does useful work to the passed context.

Basically a function that modifies a volume in some way.

### `Options`

Options are whatever your generators collectively need them to be. The type of each generator is parameterised by the type of its individual options, and the options type of a composition of generators is the union of those options.

The intention is that options are reused within ecosystems of generators — i.e. you should design your generator's options in such a way that people you haven't met could write their own generators which extend yours in ways you hadn't considered.

## Standard library

General-purpose generators and utilities, as a stepping-off point for building other generators.

### `begat/std/clone` (generator)

Copies the contents of the current directory to the root of the volume.

A good first step in a generator pipeline which modifies an existing project.

### `begat/std/template` (generator)

Renders [eta templates](https://eta.js.org/) (similar to ejs) to the output volume.

See the [example workspaces](./example) for an example based on this generator.

### `begat/std/aside` (generator)

```ts
(fn: (context: Context) => void) => Generator
```

Runs the passed function on a deep copy of the context. Useful for debugging pipelines, e.g.:

```ts
begat.compose([
  clone,
  buggyGenerator,
  aside(({ volume }) => console.log(volume.toJSON())),
  anotherGenerator,
])
```

### `begat/std/diff`

Open your git difftool, comparing the state of the volume against your working directory.

```js
import * as begat from "begat"
import { diff } from "begat/std/diff"

begat
  .pipeline([ ... ])
  .withOptions({ ... })
  .then(diff)
```

### `begat/std/write`

Copy all files from the root of the volume into your working directory.

```js
import * as begat from "begat"
import { write } from "begat/std/write"

begat
  .pipeline([ ... ])
  .withOptions({ ... })
  .then(write)
```
