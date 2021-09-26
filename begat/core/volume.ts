import * as assert from "assert"
import * as fg from "fast-glob"
import * as git from "isomorphic-git"
import * as memfs from "memfs"
import { fromPairs, zip } from "ramda"

export type VolumeInstance = InstanceType<typeof memfs.Volume>
export const Volume = memfs.Volume

export const fsFromVolumeCB = function (volume: VolumeInstance) {
  return memfs.createFsFromVolume(volume) as unknown as typeof import("fs")
}

export const fsFromVolume = function (volume: VolumeInstance) {
  return memfs.createFsFromVolume(volume)
    .promises as unknown as typeof import("fs/promises")
}

export const globFromVolume = function (volume: VolumeInstance) {
  return async function (patterns: string | string[], options?: fg.Options) {
    return fg(patterns, {
      absolute: true,
      cwd: "/",
      fs: fsFromVolumeCB(volume),
      ...options,
    })
  }
}

export const hashVolume = async function (volume: VolumeInstance) {
  const fs = fsFromVolume(volume)
  const glob = globFromVolume(volume)

  const paths = await glob("**/*")
  const hashes = await Promise.all(
    paths
      .map(path => fs.readFile(path, "utf8"))
      .map(objects => objects.then(object => git.hashBlob({ object })))
      .map(result => result.then(({ oid }) => oid))
  )

  assert.equal(paths.length, hashes.length)
  return fromPairs(zip(paths, hashes))
}
