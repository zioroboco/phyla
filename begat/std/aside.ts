import type { Context, Generator } from "begat/core/api"

type Aside = (fn: (context?: Context) => any) => Generator

export const aside: Aside = function (fn) {
  return () => async context => {
    fn(context)
    return context
  }
}
