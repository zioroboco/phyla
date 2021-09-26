import { Union } from "ts-toolbelt"

export type Generator<C = {}> = (config: C) => void

/** Union of config properties from a list of generator functions. */
type ConfigUnion<Gs extends Generator<any>[]> = Union.IntersectOf<
  Parameters<Gs[number]>[0]
>

type Dependencies = {
  process: typeof process
}

export const withDependencies = (dependencies: Dependencies) => ({
  withGenerators: <Gs extends Generator<any>[]>(generators: Gs) => ({
    withConfig: function (config: ConfigUnion<Gs>) {},
  }),
})

export const { withGenerators } = withDependencies({ process })
