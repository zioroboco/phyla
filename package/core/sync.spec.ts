import { Volume, fsFromVolume } from "begat/core/volume"
import { expect, it } from "@jest/globals"
import { sync } from "begat/core/sync"

const input = Volume.fromJSON({
  "/.git/stuff": "dot-git-stuff",
  "/one": "data-one",
  "/deep/two": "data-two",
  "/deep/deep/three": "data-three",
  "/executable": "#!/bin/sh\n\necho neato\n",
})

input.chmodSync("/executable", 0o755)

it(`syncs into the root of an empty volume`, async () => {
  const output = Volume.fromJSON({})

  await sync({
    from: { fs: fsFromVolume(input), path: "/" },
    to: { fs: fsFromVolume(output), path: "/" },
  })

  expect(output.toJSON()).toMatchObject({
    "/.git/stuff": "dot-git-stuff",
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

  await sync({
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

it(`syncs into a deep directory of an empty volume`, async () => {
  const output = Volume.fromJSON({})

  await sync({
    from: { fs: fsFromVolume(input), path: "/" },
    to: { fs: fsFromVolume(output), path: "/working/directory" },
  })

  expect(output.toJSON()).toMatchObject({
    "/working/directory/one": "data-one",
    "/working/directory/deep/two": "data-two",
    "/working/directory/deep/deep/three": "data-three",
  })
})

it(`syncs the input file mode`, async () => {
  const output = Volume.fromJSON({})

  await sync({
    from: { fs: fsFromVolume(input), path: "/" },
    to: { fs: fsFromVolume(output), path: "/" },
  })

  expect(output.statSync("/executable").mode.toString(8)).toMatch(/755$/)
})

it(`respects ignore patterns`, async () => {
  const output = Volume.fromJSON({})

  await sync({
    from: { fs: fsFromVolume(input), path: "/" },
    to: { fs: fsFromVolume(output), path: "/" },
    ignore: [".git"],
  })

  expect(output.toJSON()).toMatchObject({
    "/one": "data-one",
    "/deep/two": "data-two",
    "/deep/deep/three": "data-three",
  })

  expect(output.toJSON()).not.toMatchObject({
    "/.git/stuff": "dot-git-stuff",
  })
})
