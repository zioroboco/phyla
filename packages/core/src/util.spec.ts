import { describe, expect, it } from "@jest/globals"
import { getMeta } from "./util.js"

describe(getMeta.name, () => {
  it(`returns the local package name and version`, () => {
    const meta = getMeta()
    expect(meta).toMatchObject({
      name: "@phyla/core",
      version: expect.stringMatching(/^\d+\.\d+\.\d+$/),
    })
  })
})
