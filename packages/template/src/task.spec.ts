import * as path from "path"
import * as url from "url"
import { Volume, createFsFromVolume } from "memfs"
import { before, describe, it, test } from "mocha"
import expect from "expect"

import { task } from "./task"

describe(`applying templates`, () => {
  const directory = path.resolve(
    path.dirname(url.fileURLToPath(import.meta.url)),
    "./fixtures/apply"
  )

  describe(`rendering templates`, () => {
    const vol = new Volume()

    before(async () => {
      await task(
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
  })
})

test.only(`upgrading a template`, async () => {
  const directory = path.resolve(
    path.dirname(url.fileURLToPath(import.meta.url)),
    "./fixtures/upgrade"
  )

  const vol = Volume.fromJSON({
    "/project/package.json": `{
  "name": "my-package"
  "description": "",
  "author": "Blep B. Leppington <b.lep@example.com>"
  "private": true,
  "scripts": {
    "lint": "eslint src",
    "test": "mocha"
  },
  "workspaces": [
    "workspace-one",
    "workspace-two",
  ],
  "dependencies: {
    "package-one": "1.0.0",
    "package-two": "2.0.0",
    "package-three": "3.0.0",
  }
}`,
  })

  await task(
    {
      // @ts-ignore
      fs: createFsFromVolume(vol),
      cwd: "/project",
    },
    {
      directory,
      upgrade: true,
      variables: {
        package: { name: "my-package" },
        author: {
          name: "Blep B. Leppington",
          email: "b.lep@example.com",
        },
        workspaces: ["workspace-one", "workspace-two"],
        dependencies: [
          ["package-one", "1.0.0"],
          ["package-two", "2.0.0"],
        ],
      },
    }
  )

})
