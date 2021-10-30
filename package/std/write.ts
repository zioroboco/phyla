import { fsFromVolume } from "begat/core/volume"
import { sync } from "begat/core/sync"
import fs_system from "fs"
import type { Context } from "begat/core/api"

export const write = async (context: Context): Promise<Context> => {
  await sync({
    from: { fs: fsFromVolume(context.volume), path: "/" },
    to: { fs: fs_system, path: context.cwd },
  })
  return context
}
