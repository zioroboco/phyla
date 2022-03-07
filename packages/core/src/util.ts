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

export const getMeta = function (moduleUrl: string): Meta {
  const moduleDir = path.dirname(url.fileURLToPath(moduleUrl))
  const packageJsonPath = findupSync("package.json", moduleDir)

  if (!packageJsonPath) {
    return {}
  }

  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"))

  return {
    name: packageJson.name,
    version: packageJson.version,
  }
}
