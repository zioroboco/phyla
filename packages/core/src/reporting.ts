import { Pass, Report } from "@phyla/assert"

export const boldred = (s: string) => `\x1b[1m\x1b[31m${s}\x1b[0m`
export const inverse = (s: string) => `\x1b[7m${boldred(s)}\x1b[0m`
export const dim = (s: string) => `\x1b[2m${s}\x1b[0m`

export function check (
  report: Report,
  meta: { name?: string, version?: string },
  phase: "pre" | "post"
) {
  const failures = report.results.filter(r => r.outcome != Pass)

  if (failures.length) {
    failures.forEach(({ descriptions, outcome }, i) => {
      const body =
        outcome instanceof Error
          ? outcome.stack ?? outcome.message
          : String(outcome)

      process.stderr.write(
        [
          "\n",
          inverse(` ${phase.toUpperCase()} (${i + 1}/${failures.length}) `),
          meta.name ?? "untitled task",
          dim(meta.version ? `v${meta.version}` : "unversioned"),
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
    throw `${n} failure${n > 1 ? "s" : ""} in ${phase}-task assertion phase`
  }
}
