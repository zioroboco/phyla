import { Context, fsFromVolume } from "begat/core/api"
import { SpawnOptions, spawn } from "child_process"
import { sync } from "begat/core/sync"
import fs from "fs"
import tmp from "tmp-promise"

const spawnOptions: SpawnOptions = {
  stdio: "inherit",
}

type Options = Partial<{
  cwd: string
}>

export const patch = async (context: Context, options?: Options): Promise<Context> => {
  options = { cwd: process.cwd(), ...options }

  const dir = await tmp.dir({ unsafeCleanup: true })

  await sync({
    from: { fs: fsFromVolume(context.volume), path: "/" },
    to: { fs, path: dir.path },
  })

  const gitArgs = `diff --no-index --patch ${options.cwd} ${dir.path}`

  return new Promise((resolve, reject) => {
    spawn("git", gitArgs.split(" "), spawnOptions).on("exit", () => {
      dir.cleanup()
      resolve(context)
    })
  })
}
