import { fsFromVolume } from "begat/core/volume"
import { sync } from "begat/core/sync"
import fs from "fs"
import type { Generator } from "begat/core/api"

type Options = {
  clone?: {
    path?: string
    ignore?: string[]
  }
}

export const clone: Generator<Options> = options => async context => {
  await sync({
    from: { fs, path: options.clone?.path ?? process.cwd() },
    to: { fs: fsFromVolume(context.volume), path: "/" },
    ignore: options.clone?.ignore,
  })
  return context
}
