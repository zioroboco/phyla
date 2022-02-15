import * as Eta from "eta"
import * as system_fs from "fs/promises"
import { Task } from "begat"
import { strict as assert } from "assert"
import { createRequire } from "module"
import { dirname } from "path"
import { fileURLToPath } from "url"
import { join } from "path"
import expect from "expect"

const require = createRequire(import.meta.url)
const meta = require("../package.json")

const supportedLicenses = ["MIT"] as const

export type Options = {
  license: typeof supportedLicenses[number]
  author: string
}

export const license: Task<Options> = options => ({
  name: meta.name,
  version: meta.version,

  pre: function ({ describe, it }, ctx) {
    return [
      describe(`meta values`).assert(() => [
        it(`includes the name`, () => {
          expect(this.name).toBe("begat-example-task")
        }),
        it(`includes the name`, () => {
          expect(this.version).toBe("0.0.0")
        }),
      ]),

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
    ]
  },

  run: async function (ctx) {
    const templateDir = join(
      dirname(fileURLToPath(import.meta.url)),
      "../templates"
    )

    const templateData = await system_fs.readFile(
      join(templateDir, "LICENSE.eta"),
      "utf8"
    )

    const rendered = await Eta.render(templateData, options, {
      autoEscape: false,
      autoTrim: false,
      rmWhitespace: false,
    })

    assert(rendered)
    await ctx.fs.promises.writeFile(join(ctx.cwd, "LICENSE"), rendered)

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

  post: function ({ describe, it }, ctx) {
    return [
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
    ]
  },
})
