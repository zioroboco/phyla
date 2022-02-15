import * as pico from "picospec"

export const boldred = (s: string) => `\x1b[1m\x1b[31m${s}\x1b[0m`
export const inverse = (s: string) => `\x1b[7m${boldred(s)}\x1b[0m`
export const dim = (s: string) => `\x1b[2m${s}\x1b[0m`

export function check (
  report: pico.Report,
  meta: { name?: string, version?: string },
  phase: "pre" | "post"
) {
  const failures = report.results.filter(r => r.outcome != pico.Pass)

  if (failures.length) {
    failures.forEach(({ descriptions, outcome }, i) => {
      const body =
        outcome instanceof Error
          ? outcome.stack ?? outcome.message
          : String(outcome)

      process.stderr.write(
        [
          inverse(` ${phase.toUpperCase()} (${i + 1}/${failures.length}) `),
          meta.name && meta.name,
          meta.version && dim(`v${meta.version}`),
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
