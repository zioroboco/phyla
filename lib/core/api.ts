import { Union } from "ts-toolbelt"

export type Context = {
  cwd: string,
  fs: typeof import("fs"),
}

export type AbstractOptions = any

export type Suite = unknown

export type Task<Options extends AbstractOptions> = {
  implementation: (context: Context, options: Options) => void | Promise<void>
  before?: (context: Context, options: Options) => Suite
  after?: (context: Context, options: Options) => Suite
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

    // if (task.before) {
    //   for (const suite of task.before(context, options)) {
    //     suite.run()
    //   }
    // }

    await task.implementation(context, options)

    // if (task.after) {
    //   for (const suite of task.after(context, options)) {
    //     suite.run()
    //   }
    // }

  }
}
