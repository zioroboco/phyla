import { Task } from "begat"
import { createRequire } from "module"
import { join } from "path"
import expect from "expect"

const meta = createRequire(import.meta.url)("../package.json")

const supportedLicenses = ["MIT"] as const

export type Options = {
  license: typeof supportedLicenses[number]
  author: string
}

export const license: Task<Options> = options => ({
  name: meta.name,
  version: meta.version,

  pre: ({ describe, it }, ctx) => [
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
          await ctx.fs.promises.readFile(join(ctx.cwd, "package.json"), "utf8")
        ),
      }))
      .assert(({ packageJson }) => [
        it(`exists`, async () => {
          expect(packageJson).toMatchObject({})
        }),
      ]),
  ],

  run: async ctx => {
    const packageJson = JSON.parse(
      await ctx.fs.promises.readFile(join(ctx.cwd, "package.json"), "utf8")
    )

    packageJson.author = options.author
    packageJson.license = options.license

    await ctx.fs.promises.writeFile(
      join(ctx.cwd, "package.json"),
      JSON.stringify(packageJson, null, 2) + "\n"
    )
  },

  post: ({ describe, it }, ctx) => [
    describe(`the package.json file`)
      .setup(async () => ({
        packageJson: JSON.parse(
          await ctx.fs.promises.readFile(join(ctx.cwd, "package.json"), "utf8")
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
  ],
})
