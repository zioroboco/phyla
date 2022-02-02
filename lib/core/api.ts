import * as pico from "picospec"
import { Union } from "ts-toolbelt"

export type Context = {
  cwd: string,
  fs: typeof import("fs"),
}

export type AbstractOptions = any

export type Task<Options extends AbstractOptions> = (options: Options) => {
  action: (context: Context) => void | Promise<void>
  before?: (context: Context) => Promise<pico.Suite>
  after?: (context: Context) => Promise<pico.Suite>
}

export type AbstractTask = Task<AbstractOptions>

export type OptionsUnion<Tasks extends AbstractTask[]> =
  Union.IntersectOf<Parameters<Tasks[number]>[0]>

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
  for (const task of config.pipeline) {
    const instance = task(config.options)

    if (instance.before) {
      const test = pico.runner(await instance.before(context))
      await test().then(results => {
        if (results.failures) {
          throw new Error(`before suite failed`)
        }
      })
    }

    await instance.action(context)

    if (instance.after) {
      const test = pico.runner(await instance.after(context))
      await test().then(results => {
        if (results.failures) {
          throw new Error(`after suite failed`)
        }
      })
    }
  }
}
