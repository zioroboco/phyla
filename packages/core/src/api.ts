import * as E from "fp-ts/Either"
import * as TE from "fp-ts/TaskEither"
import * as assertions from "@phyla/assert"
import * as reporting from "./reporting.js"
import { Union } from "ts-toolbelt"
import { getMeta } from "./util.js"
import { pipe } from "fp-ts/function"

export function run (task: Chainable, ctx: Context) {
  return task(TE.of(ctx))()
}

type Assertions = (
  { describe, it }: {
    describe: typeof assertions.describe
    it: typeof assertions.it
  },
  context: Context,
) => Array<assertions.Block | assertions.Test>

/**
 * Details about the task or pipeline, used in stack traces and reporting.
 */
export type Meta = {
  name?: string
  version?: string
}

/**
 * State passed down through pipelines of tasks.
 */
export interface Context {
  /**
   * The target project directory.
   */
  cwd: string
  /**
   * The filesystem module to be used.
   */
  fs: typeof import("fs")
  /**
   * Stack trace, for errors and other output.
   */
  stack: Meta[]
}

/**
 * Object describing the behavior of a task or pipeline.
 */
export interface TaskDefinition {
  /**
   * Run implementation of the task or pipeline.
   */
  run: (context: Context) => Promise<void | Context>
  meta?: Meta
  pre?: Assertions
  post?: Assertions
}

/**
 * Chainable instance of a pipeline or task.
 */
export type Chainable = (
  ma: TE.TaskEither<Error, Context>
) => TE.TaskEither<Error, Context>

/**
 * Factory function for defining tasks.
 *
 * Takes a definition in the form of a function from the task's (typed)
 * parameters to an object defining the task's behavior. Returns a function of
 * those same parameters to a chainable instance of the task.
 *
 * @param init A function from the task's parameters to its definition.
 * @returns A function returning a chainable instance of the task.
 * @typeParam P The parameters of the resulting task.
 */
export function task<P> (
  init: (parameters: P) => TaskDefinition
): (parameters: P) => Chainable {
  return parameters => {
    const definition = init(parameters)
    const meta = getMeta(definition.meta)
    return TE.chain(
      (ctx: Context) =>
        TE.tryCatch(async () => {
          ctx.stack.push(meta)

          if (definition.pre) {
            const suite = definition.pre(
              { describe: assertions.describe, it: assertions.it },
              ctx
            )
            const report = await assertions.run(suite)
            reporting.check(report, definition.meta!, "pre")
          }

          const rv = await definition.run(ctx)

          if (definition.post) {
            const suite = definition.post(
              { describe: assertions.describe, it: assertions.it },
              ctx
            )
            const report = await assertions.run(suite)
            reporting.check(report, definition.meta!, "post")
          }

          ctx.stack.pop()
          return rv ?? ctx
        }, toError(ctx.stack))
    )
  }
}

function toError (stack: Meta[]) {
  return (e: unknown) =>
    E.toError(`${e} (from: ${stack.map(s => s.name).join(" -> ")})`)
}

/**
 * The required API for tasks exported from modules.
 *
 * @example ```ts
 * // my-task.ts
 *
 * export default task((params: {...}) => ({
 *   run: async ctx => {...}
 * }))
 * ```
 */
export interface TaskModule<P extends unknown = any> {
  default: (parameters: P) => Chainable
}

type ParametersUnion<Modules extends readonly Promise<TaskModule>[]> =
  Union.IntersectOf<Parameters<Awaited<Modules[number]>["default"]>[0]>

/**
 * Describes the task modules and specific parameters that make up a pipeline.
 *
 * @typeParam Modules See {@link TaskModule}.
 */
export interface PipelineDefinition<Modules, ModuleParameters> {
  meta?: Meta
  /**
   * A list of (unresolved) async {@link TaskModule} imports.
   *
  * @example ```ts
  * // my-pipeline.ts
  *
  * export default pipeline((params: {...}) => ({
  *   tasks: [
  *     import("some-other-task"),
  *     import("some-other-pipeline"),
  *   ],
  * }))
  * ```
  */
  tasks: Modules
  /**
   * The union of parameters specified by this pipeline's tasks.
   */
  parameters: ModuleParameters
}

/**
 * Factory function for defining pipelines of tasks.
 *
 * Takes a definition, either in the form of an object describing the pipeline,
 * OR as a function from the pipeline's (typed) parameters to to that object.
 *
 * Parameters can be provided either by other pipelines composing the pipeline,
 * or via the CLI.
 *
 * @param init An object defining the pipeline, or a function from the
 * pipeline's (typed) parameters to its definition (see: {@link task}).
 * @returns A function returning a chainable instance of the pipeline.
 * @typeParam P The parameters of the resulting pipeline.
 */
export function pipeline<Modules extends readonly Promise<TaskModule>[], P> (
  init: ((parameters: P) => {
    meta?: Meta
    tasks: Modules
    parameters: ParametersUnion<Modules>
  }) | {
    meta?: Meta
    tasks: Modules
    parameters: ParametersUnion<Modules>
  }
): (parameters: P) => Promise<Chainable> {
  return async (outer: P) => {
    const definition = typeof init === "function" ? init(outer) : init

    const tasks = await Promise.all(definition.tasks).then(allResolved =>
      allResolved.map(module => module.default)
    )

    return task((inner: ParametersUnion<Modules>) => ({
      meta: getMeta(definition.meta),
      // @ts-ignore: can't infer argument types from a tasks array
      run: async ctx => pipe(TE.of(ctx), ...tasks.map(t => t(inner)))().then(
        // @ts-ignore: expects a context, but we deliberately throw
        E.getOrElse(e => {
          throw e
        })
      ),
    }))(definition.parameters)
  }
}
