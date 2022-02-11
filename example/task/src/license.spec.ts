import { Options, license } from "./license"
import { Volume, createFsFromVolume } from "memfs"
import { it } from "@jest/globals"
import { run } from "begat"

it(`passes`, async () => {
  const volume = Volume.fromJSON(
    {
      "package.json": JSON.stringify({
        name: "test",
        version: "1.0.0",
        author: "blep",
      }),
    },
    "/somewhere"
  )

  const options: Options = {
    author: "Blep B. Leppington",
    license: "MIT",
  }

  await run(license(options), {
    cwd: "/somewhere",
    // @ts-ignore
    fs: createFsFromVolume(volume),
    pipeline: { next: [], prev: [] },
  })
})
