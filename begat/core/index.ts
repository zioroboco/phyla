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

export type Generator<O = {}> = (options: O, context: Context) => Promise<Context>

type AbstractGenerator = Generator<any>
type OptionsUnion<Gs extends AbstractGenerator[]> = Union.IntersectOf<Parameters<Gs[number]>[0]>

export const withGenerators = <Gs extends AbstractGenerator[]>(generators: Gs) => ({
  withContext: (context: Context = { volume: new Volume() }) => ({
    withOptions: async function (options: OptionsUnion<Gs>): Promise<Context> | Context {
      for (const generator of generators) {
        try {
          context = await generator(options, context)
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

export default {}
