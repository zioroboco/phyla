import { fsFromVolume } from "begat/core/volume"
import { sync } from "begat/core/sync"
import fs_system from "fs"
import type { Context } from "begat/core/api"

type Options = Partial<{
  cwd: string
}>

export const write = async (context: Context, options?: Options): Promise<Context> => {
  await sync({
    from: { fs: fsFromVolume(context.volume), path: "/" },
    to: { fs: fs_system, path: options?.cwd ?? process.cwd() },
  })
  return context
}
