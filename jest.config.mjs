import { createRequire } from "module"
import { pathsToModuleNameMapper } from "ts-jest"

const require = createRequire(import.meta.url)
const { workspaces } = require("./package.json")
const { compilerOptions } = require("./tsconfig.json")

/**
 * @type {import("@jest/types").Config.InitialOptions}
 */
export const config = {
  testMatch: ["**/*.spec.ts"],
  preset: "ts-jest/presets/default-esm",
  testEnvironment: "node",

  roots: ["<rootDir>/package/src", "<rootDir>/example/task/src"],
  moduleNameMapper: pathsToModuleNameMapper(compilerOptions.paths, {
    prefix: "<rootDir>",
  }),

  globals: {
    "ts-jest": {
      isolatedModules: true,
      diagnostics: { ignoreCodes: [151001] },
      useESM: true,
      tsconfig: compilerOptions,
    },
  },
}

export default config
