import * as path from "path"
import * as url from "url"
import { Volume, createFsFromVolume } from "memfs"
import { before, describe, it } from "mocha"
import expect from "expect"

import { template } from "./render.js"

describe(`the example templates`, () => {
  const directory = path.resolve(
    path.dirname(url.fileURLToPath(import.meta.url)),
    "./fixtures"
  )

  describe(`rendering templates`, () => {
    const vol = new Volume()

    before(async () => {
      await template(
        {
        // @ts-ignore
          fs: createFsFromVolume(vol),
          cwd: "/project",
        },
        {
          directory,
          variables: {
            key: "blep",
            purpose: "shopping",
            items: ["apples", "oranges"],
          },
        }
      )
    })

    it(`renders a simple variable into template contents`, () => {
      expect(vol.toJSON()).toMatchObject({
        "/project/config.json": `{\n  "key": "blep"\n}\n`,
      })
    })

    it(`renders a simple variable into template filename`, () => {
      expect(vol.toJSON()).toMatchObject({
        "/project/blep.json": `{\n  "key": "blep"\n}\n`,
      })
    })

    it(`renders a simple variable into nested template filenames`, () => {
      expect(vol.toJSON()).toMatchObject({
        "/project/blep/blep.blep": `blep!\n`,
      })
    })

    it(`renders a function, preserving whitespace from template`, () => {
      expect(vol.toJSON()).toMatchObject({
        "/project/list.md": `shopping list:\n  - apples\n  - oranges\n`,
      })
    })

    it(`allows escaping double-curlies, e.g. in jsx`, () => {
      expect(vol.toJSON()).toMatchObject({
        "/project/props.jsx":
          `export const Thing = () => <div prop={{ value: "blep" }} />\n`,
      })
    })

    it(`captures and removes slots (which render nothing by default)`, () => {
      expect(vol.toJSON()).toMatchObject({
        "/project/slot.md":
          `Start\n\nEnd\n`,
      })
    })
  })
})
