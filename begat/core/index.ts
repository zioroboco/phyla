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

export const defaultContext: Context = {
  volume: new Volume(),
}

export const makeDefaultContext = function (overrides: Partial<Context> = {}): Context {
  return {
    ...defaultContext,
    ...overrides,
  }
}

export type Generator<Options = {}> = (options: Options) => (context: Context) => Promise<Context>

type AbstractGenerator = Generator<any>
type OptionsUnion<Gs extends AbstractGenerator[]> = Union.IntersectOf<Parameters<Gs[number]>[0]>

export const compose = function <Gs extends AbstractGenerator[]>(generators: Gs) {
  return function (options: OptionsUnion<Gs>) {
    return async function (context: Context): Promise<Context> {
      for (const generator of generators) {
        try {
          context = await generator(options)(context)
        } catch (e: any) {
          throw new Error(
            `Generator ${generator.name} failed with error: ${e.message ?? e}`
          )
        }
      }
      return context
    }
  }
}

export const apply = {
  generators: function <Gs extends AbstractGenerator[]>(generators: Gs) {
    return {
      withOptions: function (options: OptionsUnion<Gs>): Promise<Context> {
        return compose(generators)(options)(makeDefaultContext())
      },
    }
  },
}
