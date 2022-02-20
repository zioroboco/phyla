import * as system_fs from "fs/promises"
import { strict as assert } from "assert"
import { createRequire } from "module"
import { dirname } from "path"
import { fileURLToPath } from "url"
import { join } from "path"

import * as Eta from "eta"
import { task } from "@phyla/core"
import expect from "expect"

const require = createRequire(import.meta.url)
const meta = require("../package.json")

const supportedLicenses = ["MIT"] as const

export type Parameters = {
  license: typeof supportedLicenses[number]
  author: string
}

export default task((params: Parameters) => ({
  name: meta.name,
  version: meta.version,

  pre: ({ describe, it }, ctx) => [
    it(`specified a supported license`, () => {
      expect(supportedLicenses).toContain(params.license)
    }),

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
    const templateDir = join(
      dirname(fileURLToPath(import.meta.url)),
      "../templates"
    )

    const templateData = await system_fs.readFile(
      join(templateDir, "LICENSE.eta"),
      "utf8"
    )

    const rendered = await Eta.render(templateData, params, {
      autoEscape: false,
      autoTrim: false,
      rmWhitespace: false,
    })

    assert(rendered)
    await ctx.fs.promises.writeFile(join(ctx.cwd, "LICENSE"), rendered)

    const packageJson = JSON.parse(
      await ctx.fs.promises.readFile(join(ctx.cwd, "package.json"), "utf8")
    )

    packageJson.author = params.author
    packageJson.license = params.license

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
          expect(packageJson.author).toBe(params.author)
        }),
        it(`records the expected license`, async () => {
          expect(packageJson.license).toBe(params.license)
        }),
      ]),
  ],
}))
