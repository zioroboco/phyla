import * as E from "fp-ts/Either"
import * as TE from "fp-ts/TaskEither"

/**
 * State passed down through pipelines of tasks.
 */
export type Context = {
  /** The target project directory. */
  cwd: string
  /** Stack trace, for errors and other output. */
  stack: string[]
}

/**
 * Object describing the behavior of a task or pipeline.
 */
export type Definition = {
  /** The name of the task or pipeline. */
  name: string
  /** Run implementation of the task or pipeline. */
  run: (context: Context) => Promise<void | Context>
}

/**
 * Chainable instance of a pipeline or task.
 */
export type Chainable = (
  ma: TE.TaskEither<Error, Context>
) => TE.TaskEither<Error, Context>

/**
 * A type-safe factory function for defining tasks.
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
  init: (parameters: P) => Definition
): (parameters: P) => Chainable {
  return parameters => {
    const definition = init(parameters)
    return TE.chain(
      (ctx: Context): TE.TaskEither<Error, Context> =>
        TE.tryCatch(async () => {
          ctx.stack.push(definition.name)
          const rv = await definition.run(ctx)
          ctx.stack.pop()
          return rv || ctx
        }, toError(ctx.stack))
    )
  }
}

function toError (stack: string[]) {
  return (e: unknown) => E.toError(`${e} (from: ${stack.join(" -> ")})`)
}
