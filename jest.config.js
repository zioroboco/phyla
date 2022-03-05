const { compilerOptions } = require("./tsconfig.json")

/**
 * @type {import("@jest/types").Config.InitialOptions}
 */
const config = {
  testMatch: ["**/*.spec.ts"],
  preset: "ts-jest/presets/default-esm",
  testEnvironment: "node",

  resolver: "jest-ts-webcompat-resolver",

  globals: {
    "ts-jest": {
      isolatedModules: true,
      useESM: true,
      tsconfig: compilerOptions,
    },
  },
}

module.exports = config
