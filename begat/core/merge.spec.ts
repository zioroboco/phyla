import { Volume, fsFromVolume } from "begat/core"
import { merge } from "begat/core/merge"

const input = Volume.fromJSON({
  "/one": "data-one",
  "/deep/two": "data-two",
  "/deep/deep/three": "data-three",
  "/executable": "#!/bin/sh\n\necho neato\n",
})

input.chmodSync("/executable", 0o755)

it(`merges into the root of an empty volume`, async () => {
  const output = Volume.fromJSON({})

  await merge({
    from: { fs: fsFromVolume(input), path: "/" },
    to: { fs: fsFromVolume(output), path: "/" },
  })

  expect(output.toJSON()).toMatchObject({
    "/one": "data-one",
    "/deep/two": "data-two",
    "/deep/deep/three": "data-three",
  })
})

it(`merges into the root of a dirty volume`, async () => {
  const output = Volume.fromJSON({
    "/noise": "noise",
    "/deep/noise": "noise",
    "/elsewhere/noise": "noise",
  })

  await merge({
    from: { fs: fsFromVolume(input), path: "/" },
    to: { fs: fsFromVolume(output), path: "/" },
  })

  expect(output.toJSON()).toMatchObject({
    "/noise": "noise",
    "/deep/noise": "noise",
    "/elsewhere/noise": "noise",
    "/one": "data-one",
    "/deep/two": "data-two",
    "/deep/deep/three": "data-three",
  })
})

it(`merges into a deep directory of an empty volume`, async () => {
  const output = Volume.fromJSON({})

  await merge({
    from: { fs: fsFromVolume(input), path: "/" },
    to: { fs: fsFromVolume(output), path: "/working/directory" },
  })

  expect(output.toJSON()).toMatchObject({
    "/working/directory/one": "data-one",
    "/working/directory/deep/two": "data-two",
    "/working/directory/deep/deep/three": "data-three",
  })
})

it(`matches the input file mode`, async () => {
  const output = Volume.fromJSON({})

  await merge({
    from: { fs: fsFromVolume(input), path: "/" },
    to: { fs: fsFromVolume(output), path: "/" },
  })

  expect(output.statSync("/executable").mode.toString(8)).toMatch(/755$/)
})
