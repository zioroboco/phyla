import * as pico from "picospec"
import { Union } from "ts-toolbelt"
import chalk from "chalk"

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

function fail (report: pico.Report, meta: TaskInstance, phase: "pre" | "post") {
  const failures = report.results.filter(r => r.outcome != pico.Pass)

  if (failures.length) {
    const boldred = (s: string) => chalk.bold(chalk.red(s))
    const inverse = (s: string) => chalk.inverse(boldred(s))

    failures.forEach(({ descriptions, outcome }, i) => {
      const body = outcome instanceof Error
        ? outcome.stack ?? outcome.message
        : String(outcome)

      process.stderr.write(
        [
          inverse(` ${phase.toUpperCase()} (${i + 1}/${failures.length}) `),
          meta.name && meta.name,
          meta.version && chalk.dim(`v${meta.version}`),
          "\n",
          boldred(`  ● ${boldred(descriptions.join(" → "))}`),
          "\n\n",
          body,
          "\n\n",
        ]
          .filter(Boolean)
          .join(" ")
      )
    })
    const n = failures.length
    throw `${n} failure${n > 1 ? "s" : ""} in ${phase}-assertion phase`
  }
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
    fail(report, instance, "pre")
  }

  await instance.run(context)

  if (instance.post) {
    const suite = instance.post(
      { describe: pico.describe, it: pico.it },
      context
    )
    const report = await pico.run(suite)
    fail(report, instance, "post")
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
