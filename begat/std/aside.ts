import { clone } from "ramda"
import type { Context, Generator } from "begat/core/api"

type Aside = (fn: (context: Context) => void) => Generator

export const aside: Aside = function (fn) {
  return () => async context => {
    fn(clone(context))
    return context
  }
}
