import * as memfs from "memfs"
import { Union } from "ts-toolbelt"

export type VolumeInstance = InstanceType<typeof memfs.Volume>
export const Volume = memfs.Volume

export const fsFromVolume = function (volume: VolumeInstance) {
  return memfs.createFsFromVolume(volume) as unknown as typeof import("fs")
}

export type Context = {
  volume: VolumeInstance
}

export type Generator<C = {}> = (config: C, context: Context) => Promise<Context>

/** Union of config properties from a list of generator functions. */
type ConfigUnion<Gs extends Generator<any>[]> = Union.IntersectOf<Parameters<Gs[number]>[0]>

export const withContext = (context: Context = { volume: new Volume() }) => ({
  withGenerators: <Gs extends Generator<any>[]>(generators: Gs) => ({
    withConfig: async function (config: ConfigUnion<Gs>): Promise<Context> {
      for (const generator of generators) {
        try {
          context = await generator(config, context)
        } catch (e: any) {
          throw new Error(
            `Generator ${generator.name} failed with error: ${e.message ?? e}`
          )
        }
      }
      return context
    },
  }),
})

export const withGenerators = withContext().withGenerators

export default {}
