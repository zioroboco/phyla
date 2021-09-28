/**
 * @type {import("@jest/types").Config.InitialOptions}
 */
const config = {
  moduleFileExtensions: ["ts", "js", "json"],
  preset: "ts-jest",
  roots: ["<rootDir>/core"],
  testEnvironment: "node",

  globals: {
    "ts-jest": {
      diagnostics: { ignoreCodes: [151001] },
      tsconfig: "tsconfig.json",
      useESM: true,
    },
  },
}

export default config
