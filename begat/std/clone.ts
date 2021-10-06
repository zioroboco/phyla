import { Generator, fsFromVolume } from "begat/core/api"
import { sync } from "begat/core/sync"
import fs from "fs"

type Options = {
  clonePath?: string
}

export const clone: Generator<Options> = options => async context => {
  await sync({
    from: { fs, path: options.clonePath ?? process.cwd() },
    to: { fs: fsFromVolume(context.volume), path: "/" },
  })
  return context
}
