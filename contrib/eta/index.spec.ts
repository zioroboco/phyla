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
    await begat
      .withDependencies({ volume })
      .withGenerators([eta])
      .withConfig({
        templates: resolve(__dirname, "fixtures/simple"),
        variables: {
          projectName: "my-cool-project",
          projectAuthor: "Raymond Luxury-Yacht <rayly@hotmail.com>",
        },
      })
  })

  it(`writes to the volume`, async () => {
    expect(volume.toJSON()).toMatchObject({
      "/out.txt": `name: Raymond Luxury-Yacht <rayly@hotmail.com>`,
    })
  })
})
