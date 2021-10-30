import { Union } from "ts-toolbelt"
import { Volume, VolumeInstance } from "begat/core/volume"

export type Context = {
  cwd: string
  volume: VolumeInstance
}

export const defaultContext: Context = {
  cwd: process.cwd(),
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

export const pipeline = function <Gs extends AbstractGenerator[]>(generators: Gs) {
  return {
    withOptions: function (options: OptionsUnion<Gs>): Promise<Context> {
      return compose(generators)(options)(makeDefaultContext())
    },
  }
}
