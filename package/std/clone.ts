import { fsFromVolume } from "begat/core/volume"
import { sync } from "begat/core/sync"
import fs from "fs"
import type { Generator } from "begat/core/api"

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
