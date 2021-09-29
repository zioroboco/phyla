import * as memfs from "memfs"
import { Union } from "ts-toolbelt"

export type VolumeInstance = InstanceType<typeof memfs.Volume>
export const Volume = memfs.Volume

export const fsFromVolume = function (volume: VolumeInstance) {
  return memfs.createFsFromVolume(volume) as unknown as typeof import("fs")
}

type Dependencies = {
  volume: VolumeInstance
}

export type Generator<C = {}> = (config: C, dependencies: Dependencies) => Promise<void>

/** Union of config properties from a list of generator functions. */
type ConfigUnion<Gs extends Generator<any>[]> = Union.IntersectOf<Parameters<Gs[number]>[0]>

export const withDependencies = (dependencies: Dependencies) => ({
  withGenerators: <Gs extends Generator<any>[]>(generators: Gs) => ({
    withConfig: async function (config: ConfigUnion<Gs>) {
      for (const generator of generators) {
        try {
          await generator(config, dependencies)
        } catch (e) {
          throw e instanceof Error ? e : new Error(
            `Error running generator ${generator.name}: ${e}`
          )
        }
      }
    },
  }),
})

export const withGenerators = withDependencies({
  volume: new Volume(),
}).withGenerators

export default {}
