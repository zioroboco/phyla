import { Suite } from "mocha"
import { Union } from "ts-toolbelt"

export type Context = {}

/** Position (type-level) of the `options` argument to the `TaskFn` type. */
export type OPTIONS_POS = 1

/** Function of `Context` and `Options` implemented in the `Task` type. */
export type TaskFn<Options, Return> =
  (context: Context, options: Options) => Return

export type AbstractOptions = any

export type Task<Options extends AbstractOptions> = {
  implementation: TaskFn<Options, void | Promise<void>>
  before?: TaskFn<Options, Suite[]>
  after?: TaskFn<Options, Suite[]>
}

export type AbstractTask = Task<AbstractOptions>

export type OptionsUnion<Tasks extends AbstractTask[]> =
  Union.IntersectOf<Parameters<Tasks[number]["implementation"]>[OPTIONS_POS]>

export const config = function <Tasks extends AbstractTask[]>(args: {
  pipeline: Tasks
  options: OptionsUnion<Tasks>
}) {
  return args
}
