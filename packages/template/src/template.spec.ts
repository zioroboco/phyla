import * as path from "path"
import * as url from "url"
import { Volume, createFsFromVolume } from "memfs"
import { describe, expect, it } from "@jest/globals"
import { template } from "./template.js"

describe(`with the template fixture`, () => {
  const directory = path.resolve(
    path.dirname(url.fileURLToPath(import.meta.url)),
    "./fixtures"
  )

  it(`renders the template`, async () => {
    const vol = new Volume()

    await template(
      {
        // @ts-ignore
        fs: createFsFromVolume(vol),
        cwd: "/project",
      },
      {
        directory,
        variables: { key: "blep" },
      }
    )

    expect(vol.toJSON()).toMatchObject({
      "/project/config.json": `{\n  "key": "blep"\n}\n`,
    })
  })
})
