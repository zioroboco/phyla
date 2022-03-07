import * as fs from "fs"
import * as path from "path"
import * as url from "url"
import { Meta } from "./api.js"
import callsites from "callsites"

export function callsiteMeta (): Meta {
  const stack = callsites()
  for (const frame of stack.slice(2)) {
    const file = frame.getFileName()
    if (file && !file.endsWith("/core/dist/api.js")) {
      const dirname = path.dirname(url.fileURLToPath(file))
      const packageJsonPath = findupSync(dirname, "package.json")
      if (packageJsonPath) {
        const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"))
        return {
          name: packageJson.name,
          version: packageJson.version,
        }
      }
    }
  }
  return {}
}

export const findupSync = function (
  current: string,
  target: string,
): string | null {
  if (current == "/") return null

  try {
    if (fs.statSync(path.join(current, target)).isFile()) {
      return path.resolve(path.join(current, target))
    }
  } catch (e) {}

  return findupSync(path.dirname(current), target)
}
