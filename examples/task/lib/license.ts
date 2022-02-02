import { Task } from "begat"
import { join } from "path"
import expect from "expect"

const supportedLicenses = ["MIT"] as const

type Options = {
  license: typeof supportedLicenses[number]
  author: string
}

export const license: Task<Options> = options => ({
  before: async ({ cwd, fs }) => ({ describe, it }) => {
    describe(`the options object`, () => {
      it(`includes an author`, () => {
        expect(options.author).toMatch("")
      })

      it(`includes a supported license`, () => {
        expect(supportedLicenses).toContain(options.license)
      })
    })

    describe(`the package.json file`, async () => {
      const packageJson = JSON.parse(
        await fs.promises.readFile(join(cwd, "package.json"), "utf8")
      )

      it(`exists`, async () => {
        expect(packageJson).toMatchObject({})
      })
    })
  },

  action: async ({ cwd, fs }) => {
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

  after: async ({ cwd, fs }) => ({ describe, it }) => {
    describe(`the package.json file`, async () => {
      const packageJson = JSON.parse(
        await fs.promises.readFile(join(cwd, "package.json"), "utf8")
      )

      it(`records the expected author`, async () => {
        expect(packageJson.author).toBe(options.author)
      })

      it(`records the expected license`, async () => {
        expect(packageJson.license).toBe(options.license)
      })
    })
  },
})
