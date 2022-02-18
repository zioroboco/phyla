import { createRequire } from "module"

const require = createRequire(import.meta.url)
const { compilerOptions } = require("./tsconfig.json")

/**
 * @type {import("@jest/types").Config.InitialOptions}
 */
export const config = {
  testMatch: ["**/*.spec.ts"],
  preset: "ts-jest/presets/default-esm",
  testEnvironment: "node",

  resolver: "jest-ts-webcompat-resolver",

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
