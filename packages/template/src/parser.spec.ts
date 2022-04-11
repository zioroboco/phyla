import { describe, it, test } from "mocha"
import expect from "expect"

import { Input, map, parseSlotNode, parseTokenType } from "./parser"
import { NodeType, SlotNode, Token, TokenType } from "./types"
import { pipe } from "fp-ts/lib/function"

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

describe(parseSlotNode.name, () => {
  describe(`when passed a slot token`, () => {
    const token = { type: TokenType.SlotExpression, value: "blep" } as Token
    const input = Input([token])
    const result = parseSlotNode(input)

    it(`successfully parses to a slot node`, () => {
      expect(result).toMatchObject({
        right: [{ type: NodeType.Slot, token }, Input(input.tokens, 1)],
      })
    })
  })

  describe(`when passed a different token`, () => {
    const token = { type: TokenType.StaticLine } as Token
    const input = Input([token])
    const result = parseSlotNode(input)

    it(`returns an error`, () => {
      expect(result).toMatchObject({
        left: {
          message: `expected token of type SlotExpression, got StaticLine`,
          input: Input(input.tokens, 1),
        },
      })
    })
  })
})
