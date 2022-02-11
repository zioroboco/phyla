import { Options, license } from "./license"
import { Volume, createFsFromVolume } from "memfs"
import { expect, test } from "@jest/globals"
import { fromPairs, toPairs } from "ramda"
import { run } from "begat"

test(`the happy path`, async () => {
  const volume = Volume.fromJSON(
    {
      "package.json": JSON.stringify({
        name: "test",
        version: "1.0.0",
        author: "blep",
      }),
    },
    "/my-project"
  )

  const options: Options = {
    author: "Blep B. Leppington",
    license: "MIT",
  }

  await run(license(options), {
    // @ts-ignore
    fs: createFsFromVolume(volume),
    cwd: "/my-project",
    pipeline: { next: [], prev: [] },
  })

  const entries = fromPairs(
    toPairs(volume.toJSON()).map(([path, data]) => [
      path,
      JSON.parse(String(data)),
    ])
  )

  expect(entries).toMatchObject({
    "/my-project/package.json": {
      name: "test",
      version: "1.0.0",
      author: "Blep B. Leppington",
      license: "MIT",
    },
  })
})
