import * as begat from "begat/core"
import * as memfs from "memfs"
import { resolve } from "path"
import eta from "./index"

let volume: InstanceType<typeof memfs.Volume>

beforeEach(() => {
  volume = new memfs.Volume()
})

describe(`the happy path`, () => {
  beforeEach(async () => {
    // @ts-ignore
    const fs = memfs.createFsFromVolume(volume) as typeof import("fs")

    await begat
      .withDependencies({ fs })
      .withGenerators([eta])
      .withConfig({
        templates: resolve("./fixtures/templates"),
        variables: {
          projectName: "my-cool-project",
          projectAuthor: "Raymond Luxury-Yacht <rayly@hotmail.com>",
        },
      })
  })

  it(`writes to the volume`, async () => {
    expect(volume.toJSON()).toMatchObject({
      "/stuff.txt": "ding!",
    })
  })
})
