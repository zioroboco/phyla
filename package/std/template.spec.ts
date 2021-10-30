import { Context, pipeline } from "begat/core/api"
import { URL } from "url"
import { Volume } from "begat/core/volume"
import { template } from "./template"

const options = {
  templates: new URL("./fixtures/simple", import.meta.url).pathname,
  variables: {
    projectName: "my-cool-project",
    projectAuthor: "Raymond Luxury-Yacht",
  },
}

describe(`on a clean volume`, () => {
  let context: Context

  beforeEach(async () => {
    context = await pipeline([template]).withOptions(options)
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
    context = await template(options)({
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
