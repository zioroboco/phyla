import * as pico from "picospec"
import { Union } from "ts-toolbelt"

export type Context = {
  cwd: string
  fs: typeof import("fs")
  pipeline: {
    prev: TaskInstance[],
    next: TaskInstance[],
  }
}

type Assertions = (api: {
  describe: typeof pico.describe
  it: typeof pico.it
}) => Array<pico.Block | pico.Test>

export type TaskInstance = {
  name?: string
  version?: string
  run: (context: Context) => void | Promise<void>
  before?: (context: Context) => Assertions
  after?: (context: Context) => Assertions
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



function format (descriptions: string[], error: unknown) {
  const boldred = (str: string) => `\x1b[1m\x1b[31m${str}\x1b[0m`
  const body = error instanceof Error
    ? error.stack ?? error.message
    : String(error)
  return `\n\n❌  ${boldred(descriptions.join(" → "))}\n\n${body}\n\n`
}

export const run = async function (
  instance: TaskInstance | undefined,
  context: Context
): Promise<void> {
  if (!instance) {
    return
  }

  if (instance.before) {
    const suite = instance.before(context)({
      describe: pico.describe,
      it: pico.it,
    })
    const report = await pico.run(suite)
    const failures = report.results.filter(r => r.outcome != pico.Pass)
    if (failures.length) {
      for (const { descriptions, outcome } of failures) {
        console.error(format(descriptions, outcome))
      }
      throw `${failures.length} failure(s) in pre-assertions`
    }
  }

  await instance.run(context)

  if (instance.after) {
    const suite = instance.after(context)({
      describe: pico.describe,
      it: pico.it,
    })
    const report = await pico.run(suite)
    const failures = report.results.filter(r => r.outcome != pico.Pass)
    if (failures.length) {
      for (const { descriptions, outcome } of failures) {
        console.error(format(descriptions, outcome))
      }
      throw `${failures.length} failure(s) in post-assertions`
    }
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
