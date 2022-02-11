import { createRequire } from "module"
import { dirname, join } from "path"
import { fileURLToPath } from "url"

const require = createRequire(import.meta.url)

/**
 * @type {import("@jest/types").Config.InitialOptions}
 */
export const common = url => ({
  testMatch: ["**/*.spec.ts"],
  preset: "ts-jest/presets/default-esm",
  testEnvironment: "node",

  globals: {
    "ts-jest": {
      isolatedModules: true,
      diagnostics: { ignoreCodes: [151001] },
      useESM: true,
      tsconfig: require(join(dirname(fileURLToPath(url)), "tsconfig.json"))
        .compilerOptions,
    },
  },
})

/**
 * @type {import("@jest/types").Config.InitialOptions}
 */
const config = {
  projects: require("./package.json").workspaces,
}

export default config
