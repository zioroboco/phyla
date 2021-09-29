import { Union } from "ts-toolbelt"
import { Volume } from "memfs"
import { fsFromVolume } from "./volume"

type Dependencies = {
  fs: typeof import("fs")
  process: typeof process
}

export type Generator<C = {}> = (config: C, dependencies: Dependencies) => Promise<void>

/** Union of config properties from a list of generator functions. */
type ConfigUnion<Gs extends Generator<any>[]> = Union.IntersectOf<Parameters<Gs[number]>[0]>

export const withDependencies = (dependencies: Dependencies) => ({
  withGenerators: <Gs extends Generator<any>[]>(generators: Gs) => ({
    withConfig: async function (config: ConfigUnion<Gs>) {
      for (const generator of generators) {
        await generator(config, dependencies)
      }
    },
  }),
})

export const withGenerators = withDependencies({
  fs: fsFromVolume(new Volume()),
  process,
}).withGenerators
