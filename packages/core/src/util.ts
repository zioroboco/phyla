import * as fs from "fs"
import * as path from "path"
import * as url from "url"

export const findupSync = function (
  target: string,
  current = path.dirname(url.fileURLToPath(import.meta.url)),
): string | null {
  if (current == "/") return null

  try {
    if (fs.statSync(path.join(current, target)).isFile()) {
      return path.relative(process.cwd(), path.join(current, target))
    }
  } catch (e) {}

  return findupSync(target, path.dirname(current))
}
