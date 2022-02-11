import * as pico from "picospec"
import * as reporting from "./reporting"
import { Union } from "ts-toolbelt"

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
    describe: typeof pico.describe
    it: typeof pico.it
  },
  context: Context,
) => Array<pico.Block | pico.Test>

export type TaskInstance = {
  name?: string
  version?: string
  run: (context: Context) => void | Promise<void>
  pre?: Assertions
  post?: Assertions
}

export type AbstractOptions = any

export type Task<Options extends AbstractOptions> = (options: Options) => TaskInstance

export type AbstractTask = Task<AbstractOptions>

export type OptionsUnion<Tasks extends AbstractTask[]> =
  Union.IntersectOf<Parameters<Tasks[number]>[0]>

export type Config = {
  pipeline: AbstractTask[]
  options: AbstractOptions
}

export const config = function <Tasks extends AbstractTask[]>(config: {
  pipeline: Tasks
  options: OptionsUnion<Tasks>
}): Config {
  return config
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
      { describe: pico.describe, it: pico.it },
      context
    )
    const report = await pico.run(suite)
    reporting.check(report, instance, "pre")
  }

  await instance.run(context)

  if (instance.post) {
    const suite = instance.post(
      { describe: pico.describe, it: pico.it },
      context
    )
    const report = await pico.run(suite)
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
