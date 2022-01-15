import { SpawnOptions, spawn } from "child_process"
import { fsFromVolume } from "begat/core/volume"
import { sync } from "begat/core/sync"
import fs from "fs"
import tmp from "tmp-promise"
import type { Context } from "begat/core/api"

const spawnOptions: SpawnOptions = {
  stdio: "inherit",
}

export const diff = async (context: Context): Promise<Context> => {
  const dir = await tmp.dir({ unsafeCleanup: true })

  await sync({
    from: { fs: fsFromVolume(context.volume), path: "/" },
    to: { fs, path: dir.path },
  })

  const gitArgs = `diff --no-index --patch ${context.cwd} ${dir.path}`

  return new Promise((resolve, reject) => {
    spawn("git", gitArgs.split(" "), spawnOptions).on("exit", () => {
      dir.cleanup()
      resolve(context)
    })
  })
}
