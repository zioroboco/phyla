import { Context, fsFromVolume } from "begat/core/api"
import { spawn } from "child_process"
import { sync } from "begat/core/sync"
import fs from "fs"
import tmp from "tmp-promise"

export const patch = async (context: Context, cwd: string = process.cwd()): Promise<Context> => {
  const dir = await tmp.dir({ unsafeCleanup: true })

  await sync({
    from: { fs: fsFromVolume(context.volume), path: "/" },
    to: { fs, path: dir.path },
  })

  return new Promise((resolve, reject) => {
    spawn("git", ["diff", "--no-index", "--patch", cwd, dir.path], { stdio: "inherit" }).on("exit", () => {
      dir.cleanup()
      resolve(context)
    })
  })
}
