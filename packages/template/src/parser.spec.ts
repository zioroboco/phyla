import { describe, it } from "mocha"
import { expect } from "earljs"

import { lex } from "./parser"

describe(lex.name, () => {
  it(`lexes static text`, () => {
    const tokens = lex("blep")
    expect(tokens).toBeAnArrayOfLength(1)

    const token = tokens[0]
    expect(token.type).toEqual("static")
    expect(token.value).toEqual("blep")
    expect(token.text).toEqual("blep")
    expect(token.line).toEqual(1)
    expect(token.col).toEqual(1)
  })

  it(`lexes an expression`, () => {
    const tokens = lex("{{ blep }}")
    expect(tokens).toBeAnArrayOfLength(1)

    const [token] = tokens
    expect(token.type).toEqual("expression")
    expect(token.value).toEqual("blep")
    expect(token.text).toEqual("{{ blep }}")
    expect(token.line).toEqual(1)
    expect(token.col).toEqual(1)
  })

  it(`lexes a spread expression`, () => {
    const tokens = lex("{{ ...blep }}")
    expect(tokens).toBeAnArrayOfLength(1)

    const [token] = tokens
    expect(token.type).toEqual("spread")
    expect(token.value).toEqual("blep")
    expect(token.text).toEqual("{{ ...blep }}")
    expect(token.line).toEqual(1)
    expect(token.col).toEqual(1)
  })

  it(`lexes a slot`, () => {
    const tokens = lex("{{ slot: blep }}")
    expect(tokens).toBeAnArrayOfLength(1)

    const [token] = tokens
    expect(token.type).toEqual("slot")
    expect(token.value).toEqual("blep")
    expect(token.text).toEqual("{{ slot: blep }}")
    expect(token.line).toEqual(1)
    expect(token.col).toEqual(1)
  })

  it(`errors on invalid syntax`, () => {
    const invalid = [
      `{{ }}`,
      `{{ ... }}`,
      `{{ slot: }}`,
    ]
    for (const input of invalid) {
      expect(() => lex(input)).toThrow(
        expect.stringMatching(/invalid syntax at line 1 col 1/)
      )
    }
  })
})
