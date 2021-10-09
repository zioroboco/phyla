import { Volume, VolumeInstance, fsFromVolume } from "begat/core/volume"
import { expectType } from "ts-expect"

const volume = new Volume()

it(`has the expected types`, () => {
  expectType<VolumeInstance>(volume)
  expectType<typeof import("fs")>(fsFromVolume(volume))
  expectType<typeof import("fs").promises>(fsFromVolume(volume).promises)
})