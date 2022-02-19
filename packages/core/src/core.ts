import * as assert from "@phyla/assert"
import { Union } from "ts-toolbelt"

import * as reporting from "./reporting.js"

export type Context = {
  cwd: string
  fs: typeof import("fs")
  pipeline: {
    prev: TaskInstance[],
    next: TaskInstance[],
  }
}

type Assertions = (
  { describe, it }: {
    describe: typeof assert.describe
    it: typeof assert.it
  },
  context: Context,
) => Array<assert.Block | assert.Test>

export type TaskInstance = {
  name?: string
  version?: string
  run: (context: Context) => void | Promise<void>
  pre?: Assertions
  post?: Assertions
}

export type AbstractOptions = any

export type Task<Options extends AbstractOptions = {}> = (options: Options) => TaskInstance

export type AbstractTask = Task<AbstractOptions>
export type TaskModule = Promise<{ default: Task<AbstractOptions> }>

export type OptionsUnion<Tasks extends TaskModule[]> =
  Union.IntersectOf<Parameters<Awaited<Tasks[number]>["default"]>[0]>

export type Config = {
  pipeline: AbstractTask[]
  options: AbstractOptions
}

export const config = async function <Tasks extends TaskModule[]>(config: {
  pipeline: Tasks
  options: OptionsUnion<Tasks>
}): Promise<Config> {
  return {
    ...config,
    pipeline: await Promise.all(
      config.pipeline.map(module => module.then(m => m.default))
    ).catch(e => {
      throw e
    }),
  }
}

export const task = function <Options extends AbstractOptions> (
  definition: (options: Options) => TaskInstance
): Task<Options> {
  return definition
}

export const run = async function (
  instance: TaskInstance | undefined,
  context: Context
): Promise<void> {
  if (!instance) {
    return
  }

  if (instance.pre) {
    const suite = instance.pre(
      { describe: assert.describe, it: assert.it },
      context
    )
    const report = await assert.run(suite)
    reporting.check(report, instance, "pre")
  }

  await instance.run(context)

  if (instance.post) {
    const suite = instance.post(
      { describe: assert.describe, it: assert.it },
      context
    )
    const report = await assert.run(suite)
    reporting.check(report, instance, "post")
  }

  const [head, ...rest] = context.pipeline.next

  await run(head, {
    ...context,
    pipeline: {
      prev: [...context.pipeline.prev, instance],
      next: rest,
    },
  })
}
