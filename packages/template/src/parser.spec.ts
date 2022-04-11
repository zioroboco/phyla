import { describe, it } from "mocha"
import expect from "expect"

import { Input, parseTokenType } from "./parser"
import { Token, TokenType } from "./types"

describe(parseTokenType.name, () => {
  const token = { type: TokenType.StaticLine } as Token
  const parse = parseTokenType(token.type)

  describe(`passed a single token of the expected type`, () => {
    const input = Input([token])
    const result = parse(input)

    it(`successfully parses the token`, () => {
      expect(result).toMatchObject({
        right: [token, Input(input.tokens, 1)],
      })
    })
  })

  describe(`passed multiple tokens`, () => {
    const input = Input([token, token])
    const result = parse(input)

    it(`parses only the first token`, () => {
      expect(result).toMatchObject({
        right: [token, Input(input.tokens, 1)],
      })
    })
  })

  describe(`passed an unexpected token`, () => {
    const input = Input([{ type: TokenType.Expression } as Token])
    const result = parse(input)

    it(`returns an error`, () => {
      expect(result).toMatchObject({
        left: {
          message: `expected token of type StaticLine, got Expression`,
          input: Input(input.tokens, 1),
        },
      })
    })
  })
})
