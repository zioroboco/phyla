import { Context, fsFromVolume } from "begat/core/api"
import { resolve } from "path"
import { spawn } from "child_process"
import { sync } from "begat/core/sync"
import { withDir } from "tmp-promise"
import fs from "fs"

export const patch = async function (context: Context, cwd: string): Promise<Context> {
  await withDir(async ({ path }) => {
    await sync({
      from: { fs: fsFromVolume(context.volume), path: "/" },
      to: { fs, path },
    })
    spawn("git", ["diff", "--no-index", "--patch", cwd, path], { stdio: "inherit" })
  })
  return context
}
