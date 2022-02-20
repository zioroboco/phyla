import * as assertions from "@phyla/assert"
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
    describe: typeof assertions.describe
    it: typeof assertions.it
  },
  context: Context,
) => Array<assertions.Block | assertions.Test>

export type TaskInstance = {
  name?: string
  version?: string
  run: (context: Context) => void | Promise<void>
  pre?: Assertions
  post?: Assertions
}

export type TaskModule<Parameters extends {}> = Promise<{
  default: (parameters: Parameters) => TaskInstance
}>

export type ParametersUnion<Modules extends TaskModule<any>[]> =
  Union.IntersectOf<Parameters<Awaited<Modules[number]>["default"]>[0]>

export type Config = {
  pipeline: ((parameters: any) => TaskInstance)[]
  parameters: any
}

export const config = async function <Modules extends TaskModule<any>[]> (
  config: {
    pipeline: Modules,
    parameters: ParametersUnion<Modules>
  }
): Promise<Config> {
  return {
    ...config,
    pipeline: await Promise.all(
      config.pipeline.map(module => module.then(m => m.default))
    ).catch(e => {
      throw e
    }),
  }
}

export const task = function <Parameters extends {}> (
  definition: (parameters: Parameters) => TaskInstance
): (parameters: Parameters) => TaskInstance {
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
      { describe: assertions.describe, it: assertions.it },
      context
    )
    const report = await assertions.run(suite)
    reporting.check(report, instance, "pre")
  }

  await instance.run(context)

  if (instance.post) {
    const suite = instance.post(
      { describe: assertions.describe, it: assertions.it },
      context
    )
    const report = await assertions.run(suite)
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
