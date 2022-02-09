import * as pico from "picospec"
import { Union } from "ts-toolbelt"

export type Context = {
  cwd: string
  fs: typeof import("fs")
}

export type AbstractOptions = any

export const describe = pico.describe
export const it = pico.it
export const suite = pico.suite

export type Suite = ReturnType<typeof pico.suite>

export type Task<Options extends AbstractOptions> = (options: Options) => {
  action?: (context: Context) => void | Promise<void>
  before?: (context: Context) => Suite
  after?: (context: Context) => Suite
}

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

export const run = async function (context: Context, config: Config) {
  for (const task of config.pipeline) {
    const instance = task(config.options)

    if (instance.before) {
      console.info(`\n--- before ${task.name} ---`)
      const report = await instance.before(context)
      if (report.failures) {
        process.exit(1)
      }
    }

    if (instance.action) {
      await instance.action(context)
    }

    if (instance.after) {
      console.info(`\n--- after ${task.name} ---`)
      const report = await instance.after(context)
      if (report.failures) {
        process.exit(1)
      }
    }
  }
}
