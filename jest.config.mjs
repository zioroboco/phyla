import { createRequire } from "module"
const require = createRequire(import.meta.url)
const { workspaces } = require("./package.json")

/**
 * @type {import("@jest/types").Config.InitialOptions}
 */
export const common = {
  moduleFileExtensions: ["ts", "js", "json"],
  preset: "ts-jest",
  testEnvironment: "node",

  globals: {
    "ts-jest": {
      diagnostics: { ignoreCodes: [151001] },
      tsconfig: "tsconfig.json",
      useESM: true,
    },
  },
}

/**
 * @type {import("@jest/types").Config.InitialOptions}
 */
const config = {
  projects: workspaces,
}

export default config
