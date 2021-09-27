import * as nodefs from "fs/promises"
import { Union } from "ts-toolbelt"

type Dependencies = {
  fs: typeof import("fs/promises")
}

export type Generator<C = {}> = (config: C, deps: Dependencies) => Promise<void>

/** Union of config properties from a list of generator functions. */
type ConfigUnion<Gs extends Generator<any>[]> = Union.IntersectOf<
  Parameters<Gs[number]>[0]
>

export const withDependencies = (dependencies: Dependencies) => ({
  withGenerators: <Gs extends Generator<any>[]>(generators: Gs) => ({
    withConfig: async function (config: ConfigUnion<Gs>) {
      await Promise.all(generators.map(g => g(config, dependencies)))
    },
  }),
})

// FIXME nodefs vs memfs confusion
export const { withGenerators } = withDependencies({ fs: nodefs })
