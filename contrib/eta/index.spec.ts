import * as begat from "begat/core"
import { resolve } from "path"
import eta from "./index"

const config = {
  templates: resolve(__dirname, "fixtures/simple"),
  variables: {
    projectName: "my-cool-project",
    projectAuthor: "Raymond Luxury-Yacht",
  },
}

describe(`on a clean volume`, () => {
  let context: begat.Context

  beforeEach(async () => {
    context = await begat
      .withGenerators([eta])
      .withConfig(config)
  })


  it(`writes to the volume`, async () => {
    expect(context.volume.toJSON()).toMatchObject({
      "/simple.txt": `Hello Raymond Luxury-Yacht!\n`,
    })
  })
})

describe(`on a dirty volume`, () => {
  let context: begat.Context

  beforeEach(async () => {
    context = await begat
      .withContext({
        volume: begat.Volume.fromJSON({
          "/other-data.txt": `Hello World!\n`,
        }),
      })
      .withGenerators([eta])
      .withConfig(config)
  })

  it(`writes to the volume`, async () => {
    expect(context.volume.toJSON()).toMatchObject({
      "/other-data.txt": `Hello World!\n`,
      "/simple.txt": `Hello Raymond Luxury-Yacht!\n`,
    })
  })
})
