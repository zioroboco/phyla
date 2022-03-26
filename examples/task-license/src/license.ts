import  * as path from "path"
import * as phyla from "@phyla/core"
import { fileURLToPath } from "url"
import { template } from "@phyla/core"
import expect from "expect"

const supportedLicenses = ["MIT"] as const

export type LicenseTaskParameters = {
  license: typeof supportedLicenses[number]
  author: string
}

export default phyla.task((params: LicenseTaskParameters) => ({
  pre: ({ describe, it }, ctx) => [
    it(`requested a supported license`, () => {
      expect(supportedLicenses).toContain(params.license)
    }),

    describe(`the package.json file`)
      .setup(async () => ({
        packageJson: JSON.parse(
          await ctx.fs.promises.readFile(
            path.join(ctx.cwd, "package.json"),
            "utf8"
          )
        ),
      }))
      .assert(({ packageJson }) => [
        it(`exists`, async () => {
          expect(packageJson).toMatchObject({})
        }),
      ]),
  ],

  run: async ctx => {
    const templateDir = path.join(
      path.dirname(fileURLToPath(import.meta.url)),
      "../templates"
    )

    await template(ctx, {
      directory: templateDir,
      variables: {
        ...params,
        year: String(new Date().getFullYear()),
      },
    })

    const packageJson = JSON.parse(
      await ctx.fs.promises.readFile(path.join(ctx.cwd, "package.json"), "utf8")
    )

    packageJson.author = params.author
    packageJson.license = params.license

    await ctx.fs.promises.writeFile(
      path.join(ctx.cwd, "package.json"),
      JSON.stringify(packageJson, null, 2) + "\n"
    )
  },

  post: ({ describe, it }, ctx) => [
    describe(`the LICENSE file`)
      .setup(async () => ({
        licenseFile: await ctx.fs.promises.readFile(
          path.join(ctx.cwd, "LICENSE"),
          "utf8"
        ),
      }))
      .assert(({ licenseFile }) => [
        it(`includes the author`, async () => {
          expect(licenseFile).toMatch(params.author)
        }),
        it(`includes the current year`, async () => {
          expect(licenseFile).toMatch(String(new Date().getFullYear()))
        }),
      ]),
    describe(`the package.json file`)
      .setup(async () => ({
        packageJson: JSON.parse(
          await ctx.fs.promises.readFile(
            path.join(ctx.cwd, "package.json"),
            "utf8"
          )
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
