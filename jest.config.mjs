import { createRequire } from "module"
const require = createRequire(import.meta.url)

/**
 * @type {import("@jest/types").Config.InitialOptions}
 */
const config = {
  projects: require("./package.json").workspaces,
}

export default config
