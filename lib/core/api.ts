import * as pico from "picospec"
import { Union } from "ts-toolbelt"

export type Context = {
  cwd: string,
  fs: typeof import("fs"),
}

export type AbstractOptions = any

export type Task<Options extends AbstractOptions> = {
  implementation: (context: Context, options: Options) => void | Promise<void>
  before?: (context: Context, options: Options) => Promise<pico.Suite>
  after?: (context: Context, options: Options) => Promise<pico.Suite>
}

export type AbstractTask = Task<AbstractOptions>

/** Position (type-level) of the `options` argument to task functions. */
export type OPTIONS_POS = 1

export type OptionsUnion<Tasks extends AbstractTask[]> =
  Union.IntersectOf<Parameters<Tasks[number]["implementation"]>[OPTIONS_POS]>

export type Config = {
  pipeline: AbstractTask[],
  options: AbstractOptions
}

export const config = function <Tasks extends AbstractTask[]>(config: {
  pipeline: Tasks
  options: OptionsUnion<Tasks>
}): Config {
  return config
}

export const run = async function (context: Context, config: Config) {
  const { pipeline, options } = config

  for (const task of pipeline) {
    if (task.before) {
      const test = pico.runner(await task.before(context, options))
      await test().then(results => {
        if (results.failures) {
          throw new Error(`before suite failed`)
        }
      })
    }

    await task.implementation(context, options)

    if (task.after) {
      const test = pico.runner(await task.after(context, options))
      await test().then(results => {
        if (results.failures) {
          throw new Error(`after suite failed`)
        }
      })
    }
  }
}
