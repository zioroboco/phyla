import { Task } from "begat"
import { join } from "path"
import expect from "expect"

type Options = {
  license: "MIT"
  author: string
}

export const license: Task<Options> = {
  before: async (context, options) => ({ describe, it }) => {
    const fs = context.fs.promises
    const cwd = context.cwd

    describe(`the options object`, () => {
      it(`includes an author`, () => {
        expect(options.author).toMatch("")
      })

      it(`specifies a supported license`, () => {
        expect(options.license).toBe("MIT")
      })
    })

    describe(`the package.json file`, async () => {
      const packageJson = JSON.parse(
        await fs.readFile(join(cwd, "package.json"), "utf8")
      )

      it(`exists`, async () => {
        expect(packageJson).toMatchObject({})
      })
    })
  },

  action: async (context, options) => {
    const fs = context.fs.promises
    const cwd = context.cwd

    const packageJson = JSON.parse(
      await fs.readFile(join(cwd, "package.json"), "utf8")
    )

    packageJson.author = options.author
    packageJson.license = options.license

    await fs.writeFile(
      join(cwd, "package.json"),
      JSON.stringify(packageJson, null, 2) + "\n"
    )
  },

  after: async (context, options) => ({ describe, it }) => {
    const fs = context.fs.promises
    const cwd = context.cwd

    describe(`the package.json file`, async () => {
      const packageJson = JSON.parse(
        await fs.readFile(join(cwd, "package.json"), "utf8")
      )

      it(`records the expected author`, async () => {
        expect(packageJson.author).toBe(options.author)
      })

      it(`records the expected license`, async () => {
        expect(packageJson.license).toBe(options.license)
      })
    })
  },
}
