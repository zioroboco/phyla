import { Context } from "begat"
import { Volume, fsFromVolume } from "begat/core/volume"
import { license } from "./license"

describe(license.name, () => {
  let fs: typeof import("fs").promises

  beforeAll(async () => {
    const context: Context = {
      cwd: "/somewhere",
      volume: Volume.fromJSON({
        "/package.json": JSON.stringify({
          name: "test-project",
          version: "0.0.0",
        }),
      }),
    }

    fs = fsFromVolume(context.volume).promises

    await license({
      author: "test-author",
      license: "MIT",
    })(context)
  })

  describe(`the license file`, () => {
    let licenseFile: string

    beforeAll(async () => {
      licenseFile = await fs.readFile("/LICENSE", "utf8")
    })

    it(`includes the author's name`, async () => {
      expect(licenseFile).toContain("test-author")
    })

    it(`includes the current year`, async () => {
      expect(licenseFile).toContain(new Date().getFullYear().toString())
    })
  })

  describe(`the package.json file`, () => {
    let packageJson: any

    beforeAll(async () => {
      packageJson = JSON.parse(await fs.readFile("/package.json", "utf8"))
    })

    it(`includes the author's name`, async () => {
      expect(packageJson.author).toEqual("test-author")
    })

    it(`includes the license type`, async () => {
      expect(packageJson.license).toEqual("MIT")
    })
  })
})
