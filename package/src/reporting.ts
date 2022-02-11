import * as pico from "picospec"
import chalk from "chalk"

export function check (
  report: pico.Report,
  meta: { name?: string, version?: string },
  phase: "pre" | "post"
) {
  const failures = report.results.filter(r => r.outcome != pico.Pass)

  if (failures.length) {
    const boldred = (s: string) => chalk.bold(chalk.red(s))
    const inverse = (s: string) => chalk.inverse(boldred(s))

    failures.forEach(({ descriptions, outcome }, i) => {
      const body =
        outcome instanceof Error
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
