import { fsFromVolume } from "begat/core/volume"
import { sync } from "begat/core/sync"
import fs from "fs"
import type { Generator } from "begat/core/api"

type CloneOptions = {
  clone?: {
    path?: string
    ignore?: string[]
  }
}

export const clone: Generator<CloneOptions> = options => async context => {
  await sync({
    from: { fs, path: options.clone?.path ?? context.cwd },
    to: { fs: fsFromVolume(context.volume), path: "/" },
    ignore: options.clone?.ignore,
  })
  return context
}
