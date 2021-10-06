import { Generator, fsFromVolume } from "begat/core/api"
import { sync } from "begat/core/sync"
import fs from "fs"

type Options = {
  cloneFromPath?: string
}

export const cloneGenerator: Generator<Options> = options => async context => {
  await sync({
    from: { fs, path: options.cloneFromPath ?? process.cwd() },
    to: { fs: fsFromVolume(context.volume), path: "/" },
  })
  return context
}
