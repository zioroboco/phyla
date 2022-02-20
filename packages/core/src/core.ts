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

export type AbstractParameters = any

export type Task<Parameters extends AbstractParameters = {}> = (
  parameters: Parameters
) => TaskInstance

export type AbstractTask = Task<AbstractParameters>
export type TaskModule = Promise<{ default: Task<AbstractParameters> }>

export type ParametersUnion<Tasks extends TaskModule[]> =
  Union.IntersectOf<Parameters<Awaited<Tasks[number]>["default"]>[0]>

export type Config = {
  pipeline: AbstractTask[]
  parameters: AbstractParameters
}

export const config = async function <Tasks extends TaskModule[]>(config: {
  pipeline: Tasks
  parameters: ParametersUnion<Tasks>
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

export const task = function <Parameters extends AbstractParameters> (
  definition: (parameters: Parameters) => TaskInstance
): Task<Parameters> {
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
