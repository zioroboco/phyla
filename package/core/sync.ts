import { join } from "path"
import glob from "fast-glob"

type FsPath = {
  fs: typeof import("fs")
  path: string,
}

type Args = {
  from: FsPath,
  to: FsPath,
  ignore?: string[],
}

export const sync = async function (args: Args) {
  const { from, to, ignore } = args

  const options: glob.Options = {
    cwd: from.path,
    fs: from.fs,
    ignore,

    dot: true,
  }

  const directories = await glob("**/*", { ...options, onlyDirectories: true })
  for (const directory of directories.map(d => join(to.path, d))) {
    await to.fs.promises.mkdir(directory, { recursive: true })
  }

  const files = await glob("**/*", { ...options })
  for (const file of files) {
    const content = await from.fs.promises.readFile(join(from.path, file))
    await to.fs.promises.writeFile(join(to.path, file), content)
    const stats = await from.fs.promises.stat(join(from.path, file))
    await to.fs.promises.chmod(join(to.path, file), stats.mode)
  }
}
