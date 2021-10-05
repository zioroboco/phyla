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

const makeDefaultContext = function (c: Partial<Context>): Context {
  return {
    volume: c.volume ?? new Volume(),
  }
}

export type Generator<Options = {}> = (o: Options, c: Context) => Promise<Context>

type AbstractGenerator = Generator<any>
type OptionsUnion<Gs extends AbstractGenerator[]> = Union.IntersectOf<Parameters<Gs[number]>[0]>

export const generators = <Gs extends AbstractGenerator[]>(gs: Gs) => ({
  context: (c: Partial<Context> = {}) => ({
    options: async function (options: OptionsUnion<Gs>) {
      let context = makeDefaultContext(c)
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

export default {
  generators,
}
