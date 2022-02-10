import { Task, describe, it, suite } from "begat"
import { join } from "path"
import expect from "expect"
import meta from "begat-example-task/package.json"

const supportedLicenses = ["MIT"] as const

type Options = {
  license: typeof supportedLicenses[number]
  author: string
}

export const license: Task<Options> = options => ({
  name: meta.name,
  version: meta.version,

  before: async ({ cwd, fs }) =>
    suite([
      describe(`the options object`).assert(() => [
        it(`includes an author`, () => {
          expect(options.author).toMatch("")
        }),
        it(`includes a supported license`, () => {
          expect(supportedLicenses).toContain(options.license)
        }),
      ]),

      describe(`the package.json file`)
        .setup(async () => ({
          packageJson: JSON.parse(
            await fs.promises.readFile(join(cwd, "package.json"), "utf8")
          ),
        }))
        .assert(({ packageJson }) => [
          it(`exists`, async () => {
            expect(packageJson).toMatchObject({})
          }),
        ]),
    ]),

  run: async ({ cwd, fs }) => {
    const packageJson = JSON.parse(
      await fs.promises.readFile(join(cwd, "package.json"), "utf8")
    )

    packageJson.author = options.author
    packageJson.license = options.license

    await fs.promises.writeFile(
      join(cwd, "package.json"),
      JSON.stringify(packageJson, null, 2) + "\n"
    )
  },

  after: async ({ cwd, fs }) =>
    suite([
      describe(`the package.json file`)
        .setup(async () => ({
          packageJson: JSON.parse(
            await fs.promises.readFile(join(cwd, "package.json"), "utf8")
          ),
        }))
        .assert(({ packageJson }) => [
          it(`records the expected author`, async () => {
            expect(packageJson.author).toBe(options.author)
          }),
          it(`records the expected license`, async () => {
            expect(packageJson.license).toBe(options.license)
          }),
        ]),
    ]),
})
