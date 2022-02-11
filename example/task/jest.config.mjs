import { common } from "../../jest.config.mjs"

/**
 * @type {import("@jest/types").Config.InitialOptions}
 */
const config = {
  ...common(import.meta.url),
}

export default config
