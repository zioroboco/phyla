import * as E from "fp-ts/Either"
import { describe, expect, it } from "@jest/globals"

import { interpret } from "./interpret.js"
import { split } from "./slot.js"

describe(split.name, () => {
  it(`slices input strings around named slot tags`, () => {
    expect(
      split(`{{ start }}{{ slot: one }}{{ middle }}{{ slot: two }}{{ end }}`)
    ).toEqual([
      "{{ start }}",
      { slot: "one" },
      "{{ middle }}",
      { slot: "two" },
      "{{ end }}",
    ])
  })

  it(`produces slices that can be rendered`, () => {
    const variables = {
      start: "start-value",
      middle: "middle-value",
      end: "end-value",
    }
    expect(
      split(
        `{{ start }}{{ slot: one }}{{ middle }}{{ slot: two }}{{ end }}`
      ).map(element => {
        if (typeof element === "string") {
          const interpreted = interpret(element, {
            variables,
            transform: () => "",
          })
          if (E.isLeft(interpreted)) {
            throw new Error(
              `Error rendering: ${element}` +
                `\n\n\t${interpreted.left.join("\n\t")}`
            )
          }
          return interpreted.right
        } else {
          return element
        }
      })
    ).toEqual([
      "start-value",
      { slot: "one" },
      "middle-value",
      { slot: "two" },
      "end-value",
    ])
  })
})
