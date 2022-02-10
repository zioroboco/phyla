import * as pico from "picospec"
import { Union } from "ts-toolbelt"

export const describe = pico.describe
export const it = pico.it
export const suite = pico.suite

export type Suite = ReturnType<typeof pico.suite>

export type Context = {
  cwd: string
  fs: typeof import("fs")
  pipeline: TaskInstance[]
}

export type TaskInstance = {
  name?: string
  version?: string
  run: (context: Context) => void | Promise<void>
  before?: (context: Context) => Suite
  after?: (context: Context) => Suite
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

export const run = async function (context: Context) {
  for (const instance of context.pipeline) {

    if (instance.before) {
      console.info(`\n--- before ${instance.name} ---`)
      const report = await instance.before(context)
      if (report.failures) {
        process.exit(1)
      }
    }

    await instance.run(context)

    if (instance.after) {
      console.info(`\n--- after ${instance.name} ---`)
      const report = await instance.after(context)
      if (report.failures) {
        process.exit(1)
      }
    }
  }
}
