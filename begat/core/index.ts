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

export const generators = <Gs extends AbstractGenerator[]>(gs: Gs) => ({
  context: (context: Context = { volume: new Volume() }) => ({
    options: async function (options: OptionsUnion<Gs>) {
      for (const generator of gs) {
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
  options: async function (options: OptionsUnion<Gs>) {
    return generators(gs).context().options(options)
  },
})

export default {}
