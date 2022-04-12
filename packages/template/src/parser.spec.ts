import { describe, it } from "mocha"
import expect from "expect"

import {
  Input,
  either,
  many,
  parseBlockNode,
  parseSlotNode,
  parseTokenType,
  sequence,
} from "./parser"
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

describe(`the ${sequence.name} combinator`, () => {
  describe(`with multiple parsers`, () => {
    const parseSpread = sequence(
      parseTokenType(TokenType.StaticPrefix),
      parseTokenType(TokenType.SpreadExpression),
      parseTokenType(TokenType.StaticSuffix),
    )

    it(`parses a matching sequence of tokens`, () => {
      const input = Input([
        { type: TokenType.StaticPrefix },
        { type: TokenType.SpreadExpression },
        { type: TokenType.StaticSuffix },
      ] as Token[])
      const result = parseSpread(input)
      expect(result).toMatchObject({
        right: [input.tokens, Input(input.tokens, 3)],
      })
    })

    it(`returns an error on a non-matching token`, () => {
      const input = Input([
        { type: TokenType.StaticPrefix },
        { type: TokenType.StaticLine },
      ] as Token[])
      const result = parseSpread(input)
      expect(result).toMatchObject({
        left: {
          message: `expected token of type SpreadExpression, got StaticLine`,
          input: Input(input.tokens, 2),
        },
      })
    })
  })
})

describe(`the ${many.name} combinator`, () => {
  const parseLines = many(parseTokenType(TokenType.StaticLine))

  describe(`passed multiple matching tokens`, () => {
    const input = Input([
      { type: TokenType.StaticLine },
      { type: TokenType.StaticLine },
      { type: TokenType.StaticLine },
    ] as Token[])
    const result = parseLines(input)

    it(`parses all tokens`, () => {
      expect(result).toMatchObject({
        right: [[
          { type: TokenType.StaticLine },
          { type: TokenType.StaticLine },
          { type: TokenType.StaticLine },
        ], Input(input.tokens, 3)],
      })
    })

    describe(`passed matching and non-mathing tokens`, () => {
      const input = Input([
        { type: TokenType.StaticLine },
        { type: TokenType.StaticLine },
        { type: TokenType.StaticPrefix },
      ] as Token[])
      const result = parseLines(input)

      it(`stops at a non-matching token`, () => {
        expect(result).toMatchObject({
          right: [[
            { type: TokenType.StaticLine },
            { type: TokenType.StaticLine },
          ], Input(input.tokens, 2)],
        })
      })
    })

    describe(`passed non-matching tokens`, () => {
      const input = Input([
        { type: TokenType.Expression },
        { type: TokenType.StaticLine },
      ] as Token[])
      const result = parseLines(input)

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
})

describe(parseBlockNode.name, () => {
  describe(`passed a sequence of tokens describing a block`, () => {
    const input = Input([
      { type: TokenType.StaticLine },
      { type: TokenType.StaticLine },
      { type: TokenType.StaticPrefix },
      { type: TokenType.Expression },
      { type: TokenType.StaticPrefix },
      { type: TokenType.Expression },
      { type: TokenType.StaticSuffix },
      { type: TokenType.StaticLine },
    ] as Token[])

    const result = parseBlockNode(input)

    it(`parses all tokens`, () => {
      expect(result).toMatchObject({
        right: [
          { type: NodeType.Block, tokens: input.tokens },
          Input(input.tokens, input.tokens.length),
        ],
      })
    })
  })

  describe(`passed a block followed by a slot`, () => {
    const input = Input([
      { type: TokenType.StaticLine },
      { type: TokenType.StaticLine },
      { type: TokenType.SlotExpression },
    ] as Token[])

    const result = parseBlockNode(input)

    it(`parses the block`, () => {
      expect(result).toMatchObject({
        right: [
          {
            type: NodeType.Block,
            tokens: [
              { type: TokenType.StaticLine },
              { type: TokenType.StaticLine },
            ] as Token[],
          },
          Input(input.tokens, 2),
        ],
      })
    })
  })
})
