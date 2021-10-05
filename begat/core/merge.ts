import { resolve } from "path"

type FsPath = {
  fs: typeof import("fs")
  path: string,
}

export const merge = async function (args: { from: FsPath, to: FsPath }) {
  const from = { fs: args.from.fs.promises, path: args.from.path }
  const to = { fs: args.to.fs.promises, path: args.to.path }

  await to.fs.mkdir(to.path, { recursive: true })

  const entries = await from.fs.readdir(from.path)

  for (const entry of entries) {
    const stats = await from.fs.stat(resolve(from.path, entry))
    if (stats.isFile()) {
      const content = await from.fs.readFile(resolve(from.path, entry))
      await to.fs.writeFile(resolve(to.path, entry), content)
    } else {
      await merge({
        from: { fs: args.from.fs, path: resolve(from.path, entry) },
        to: { fs: args.to.fs, path: resolve(to.path, entry) },
      })
    }
  }
}
