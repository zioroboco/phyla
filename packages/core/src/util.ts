import * as fs from "fs"
import * as path from "path"
import { Meta } from "./api"

function stacktrace () {
  const _prepareStackTrace = Error.prepareStackTrace
  Error.prepareStackTrace = (_, stack) => stack
  const stack = new Error().stack as unknown as NodeJS.CallSite[]
  Error.prepareStackTrace = _prepareStackTrace
  return stack
}

export function callsiteMeta (): Meta {
  const stack = stacktrace()
  for (const frame of stack.slice(3)) {
    let file = frame.getFileName()
    if (file && !file.endsWith("/core/dist/api")) {
      // something is causing paths in stack traces to be simplified in tests
      const dirname = file.startsWith("file://")
        ? path.dirname(file.slice(7))
        : path.dirname(file)
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
