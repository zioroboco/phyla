import { Context, Volume, begat } from "begat/core/api"
import { dirname, resolve } from "path"
import { fileURLToPath } from "url"
import { templateGenerator } from "./template-generator"

const __dirname = dirname(fileURLToPath(import.meta.url))

const options = {
  templates: resolve(__dirname, "fixtures/simple"),
  variables: {
    projectName: "my-cool-project",
    projectAuthor: "Raymond Luxury-Yacht",
  },
}

describe(`on a clean volume`, () => {
  let context: Context

  beforeEach(async () => {
    context = await begat
      .compose([templateGenerator])
      .withOptions(options)
  })


  it(`writes to the volume`, async () => {
    expect(context.volume.toJSON()).toMatchObject({
      "/simple.txt": `Hello Raymond Luxury-Yacht!\n`,
    })
  })
})

describe(`on a dirty volume`, () => {
  let context: Context

  beforeEach(async () => {
    context = await templateGenerator(options)({
      volume: Volume.fromJSON({
        "/other-data.txt": `Hello World!\n`,
      }),
    })
  })

  it(`writes to the volume`, async () => {
    expect(context.volume.toJSON()).toMatchObject({
      "/other-data.txt": `Hello World!\n`,
      "/simple.txt": `Hello Raymond Luxury-Yacht!\n`,
    })
  })
})
