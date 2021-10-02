import { createRequire } from "module"
const require = createRequire(import.meta.url)
const { workspaces } = require("./package.json")

/**
 * @type {import("@jest/types").Config.InitialOptions}
 */
export const common = {
  moduleFileExtensions: ["ts", "js", "json"],
  modulePathIgnorePatterns: ["\\.js$"],
  preset: "ts-jest/presets/default-esm",
  testEnvironment: "node",

  globals: {
    "ts-jest": {
      diagnostics: { ignoreCodes: [151001] },
      useESM: true,
      tsconfig: require("./tsconfig.json").compilerOptions,
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
