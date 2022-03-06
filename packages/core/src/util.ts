import * as fs from "fs"
import * as path from "path"
import * as url from "url"
import { Meta } from "./api.js"

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

export function getMeta (overrides?: Meta): Meta {
  if (overrides?.name && overrides?.version) {
    return overrides
  }

  let name: string | undefined
  let version: string | undefined
  let callsite: string | undefined

  try {
    const stack = new Error().stack
    const callsiteMatch = stack?.split("\n")[2].match(/\((.*?):/)
    if (callsiteMatch && callsiteMatch[1]) {
      callsite = callsiteMatch[1]
      const packageJsonPath = findupSync("package.json", path.dirname(callsite))
      if (packageJsonPath) {
        const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"))
        name = packageJson.name
        version = packageJson.version
      }
    }
  } catch (e) {}

  return {
    name: overrides?.name ?? name ?? (callsite ? path.relative(process.cwd(), callsite!) : "unnamed"),
    version: overrides?.version ?? version ?? "unversioned",
  }
}
