import { describe, it } from "mocha"
import expect from "expect"

import { Input, either, parseSlotNode, parseTokenType } from "./parser"
import { NodeType, Token, TokenType } from "./types"

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

describe(`the ${either.name} combinator`, () => {
  describe(`with multiple parsers`, () => {
    const parseExpression = either(
      parseTokenType(TokenType.Expression),
      parseTokenType(TokenType.SpreadExpression)
    )

    it(`parses one matching tokan`, () => {
      const input = Input([{ type: TokenType.Expression }] as Token[])
      const result = parseExpression(input)
      expect(result).toMatchObject({
        right: [{ type: TokenType.Expression }, Input(input.tokens, 1)],
      })
    })

    it(`parses a second matching token`, () => {
      const input = Input([{ type: TokenType.SpreadExpression }] as Token[])
      const result = parseExpression(input)
      expect(result).toMatchObject({
        right: [{ type: TokenType.SpreadExpression }, Input(input.tokens, 1)],
      })
    })

    it(`returns an error on a non-matching token`, () => {
      const input = Input([{ type: TokenType.StaticLine }] as Token[])
      const result = parseExpression(input)
      expect(result).toMatchObject({
        left: {
          message: `no parser succeeded`,
          input: Input(input.tokens, 0),
        },
      })
    })
  })
})
