import * as path from "path"
import * as system_fs from "fs"

import * as assertions from "@phyla/assert"
import { Union } from "ts-toolbelt"

import * as reporting from "./reporting.js"
import { getMeta } from "./util.js"

export type Context = {
  cwd: string
  fs: typeof system_fs
  io: {
    stdin: NodeJS.ReadableStream
    stdout: NodeJS.WritableStream
    stderr: NodeJS.WritableStream
  }
  tasks: {
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
  /** Defaults to the task's parent package name. */
  name?: string,
  /** Defaults to the task's parent package version. */
  version?: string,

  run: (context: Context) => void | Promise<void>
  pre?: Assertions
  post?: Assertions
}

export type TaskModule<P extends unknown = {}> = Promise<{
  default: (parameters: P) => TaskInstance
}>

export type ParametersUnion<Modules extends TaskModule[]> =
  Union.IntersectOf<Parameters<Awaited<Modules[number]>["default"]>[0]>

type ServerOptions = {
  exclude?: string[]
  watch?: string[]
}

export type PipelineConfig<P = unknown> = {
  tasks: ((parameters: unknown) => TaskInstance)[]
  parameters: P
  server?: ServerOptions
}

export const pipeline = async function <Modules extends TaskModule<any>[]> (
  config: {
    tasks: Modules,
    parameters: ParametersUnion<Modules>
    server?: ServerOptions
  }
): Promise<PipelineConfig<ParametersUnion<Modules>>> {
  return {
    ...config,
    tasks: await Promise.all(
      config.tasks.map(taskModule => taskModule.then(module => module.default))
    ).catch(e => {
      throw e
    }),
  }
}

export const task = function <P extends {}> (
  definition: (parameters: P) => TaskInstance
): (parameters: P) => TaskInstance {
  return parameters => ({
    ...getMeta(),
    ...definition(parameters),
  })
}

export const execute = async function (
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

  const [head, ...rest] = context.tasks.next

  await execute(head, {
    ...context,
    tasks: {
      prev: [...context.tasks.prev, instance],
      next: rest,
    },
  })
}
