import expect from "expect"
import { describe, it } from "mocha"

import {
  either,
  empty,
  Input,
  many,
  maybe,
  parse,
  parseBlockNode,
  parseSlotNode,
  parseSpreadNode,
  parseTokenType,
  sequence,
  where,
} from "./parse"
import {
  BlockNode,
  NodeType,
  SlotNode,
  SpreadNode,
  Token,
  TokenType,
} from "./types"

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
    const token = { type: TokenType.Slot, value: "blep" } as Token
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
          message: `expected token of type Slot, got StaticLine`,
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
      parseTokenType(TokenType.Spread),
    )

    it(`parses one matching tokan`, () => {
      const input = Input([{ type: TokenType.Expression }] as Token[])
      const result = parseExpression(input)
      expect(result).toMatchObject({
        right: [{ type: TokenType.Expression }, Input(input.tokens, 1)],
      })
    })

    it(`parses a second matching token`, () => {
      const input = Input([{ type: TokenType.Spread }] as Token[])
      const result = parseExpression(input)
      expect(result).toMatchObject({
        right: [{ type: TokenType.Spread }, Input(input.tokens, 1)],
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
      parseTokenType(TokenType.Spread),
      parseTokenType(TokenType.StaticSuffix),
    )

    it(`parses a matching sequence of tokens`, () => {
      const input = Input([
        { type: TokenType.StaticPrefix },
        { type: TokenType.Spread },
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
          message: `expected token of type Spread, got StaticLine`,
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
      { type: TokenType.Slot },
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

  describe(`passed a block followed by a spread with prefix`, () => {
    const input = Input([
      // block...
      { type: TokenType.StaticLine },
      { type: TokenType.StaticLine },
      { type: TokenType.StaticPrefix },
      { type: TokenType.Expression },
      { type: TokenType.StaticSuffix },
      // spread...
      { type: TokenType.StaticPrefix },
      { type: TokenType.Spread },
    ] as Token[])

    const result = parseBlockNode(input)

    it(`parses the block (and not the spread prefix)`, () => {
      expect(result).toMatchObject({
        right: [
          {
            type: NodeType.Block,
            tokens: [
              { type: TokenType.StaticLine },
              { type: TokenType.StaticLine },
              { type: TokenType.StaticPrefix },
              { type: TokenType.Expression },
              { type: TokenType.StaticSuffix },
            ] as Token[],
          },
          Input(input.tokens, 5),
        ],
      })
    })
  })
})

describe(`${where.name} combinator`, () => {
  describe(`when predicate is true`, () => {
    const parse = where(() => true, parseTokenType(TokenType.StaticLine))

    it(`parses matching tokens`, () => {
      const input = Input([{ type: TokenType.StaticLine }] as Token[])
      const result = parse(input)
      expect(result).toMatchObject({
        right: [{ type: TokenType.StaticLine }, Input(input.tokens, 1)],
      })
    })

    it(`doesn't parse non-matching tokens`, () => {
      const input = Input([{ type: TokenType.Expression }] as Token[])
      const result = parse(input)
      expect(result).toMatchObject({
        left: {
          message: expect.stringMatching(
            "expected token of type StaticLine, got Expression",
          ),
          input: Input(input.tokens, 1),
        },
      })
    })
  })

  describe(`when predicate is false`, () => {
    const parse = where(() => false, parseTokenType(TokenType.StaticLine))

    it(`doesn't parse matching tokens`, () => {
      const input = Input([{ type: TokenType.StaticLine }] as Token[])
      const result = parse(input)
      expect(result).toMatchObject({
        left: {
          message: expect.stringMatching("predicate is false"),
          input: Input(input.tokens, 0),
        },
      })
    })

    it(`doesn't parse non-matching tokens`, () => {
      const input = Input([{ type: TokenType.StaticLine }] as Token[])
      const result = parse(input)
      expect(result).toMatchObject({
        left: {
          message: expect.stringMatching("predicate is false"),
          input: Input(input.tokens, 0),
        },
      })
    })
  })

  describe(`when predicated on input`, () => {
    const parse = many(
      where(input => input.index < 2, parseTokenType(TokenType.StaticLine)),
    )

    it(`parses only the expected tokens`, () => {
      const input = Input([
        { type: TokenType.StaticLine },
        { type: TokenType.StaticLine },
        { type: TokenType.StaticLine },
      ] as Token[])

      const result = parse(input)
      expect(result).toMatchObject({
        right: [
          [
            { type: TokenType.StaticLine },
            { type: TokenType.StaticLine },
          ],
          Input(input.tokens, 2),
        ],
      })
    })
  })
})

describe(`parsing a series of block and slot nodes`, () => {
  const parse = many(
    either<BlockNode | SlotNode>(parseBlockNode, parseSlotNode),
  )

  const input = Input([
    { type: TokenType.StaticLine },
    { type: TokenType.StaticPrefix },
    { type: TokenType.Slot },
    { type: TokenType.StaticSuffix },
    { type: TokenType.StaticLine },
    { type: TokenType.Slot },
    { type: TokenType.Slot },
    { type: TokenType.StaticLine },
  ] as Token[])

  const result = parse(input)

  expect(result).toMatchObject({
    right: [
      [
        {
          type: NodeType.Block,
          tokens: [
            { type: TokenType.StaticLine },
            { type: TokenType.StaticPrefix },
          ],
        },
        {
          type: NodeType.Slot,
          token: { type: TokenType.Slot },
        },
        {
          type: NodeType.Block,
          tokens: [
            { type: TokenType.StaticSuffix },
            { type: TokenType.StaticLine },
          ],
        },
        {
          type: NodeType.Slot,
          token: { type: TokenType.Slot },
        },
        {
          type: NodeType.Slot,
          token: { type: TokenType.Slot },
        },
        {
          type: NodeType.Block,
          tokens: [
            { type: TokenType.StaticLine },
          ],
        },
      ],
      Input(input.tokens, 8),
    ],
  })
})

describe(maybe.name, () => {
  describe(`parsing a single (maybe) token`, () => {
    const parse = maybe(parseTokenType(TokenType.StaticPrefix))

    describe(`when the token is present`, () => {
      const input = Input([{ type: TokenType.StaticPrefix }] as Token[])
      const result = parse(input)

      it(`parses the token`, () => {
        expect(result).toMatchObject({
          right: [{ type: TokenType.StaticPrefix }, Input(input.tokens, 1)],
        })
      })
    })

    describe(`when a different token is present`, () => {
      const input = Input([{ type: TokenType.Slot }] as Token[])
      const result = parse(input)

      it(`returns an empty value without advancing the input`, () => {
        expect(result).toMatchObject({
          right: [{}, Input(input.tokens, 0)],
        })
      })
    })

    describe(`when the token is absent altogether`, () => {
      const input = Input([] as Token[])
      const result = parse(input)

      it(`returns an empty value without advancing the input`, () => {
        expect(result).toMatchObject({
          right: [{}, Input(input.tokens, 0)],
        })
      })
    })
  })

  describe(`passed multiple tokens`, () => {
    const parse = sequence(
      maybe(parseTokenType(TokenType.StaticPrefix)),
      parseTokenType(TokenType.Spread),
      maybe(parseTokenType(TokenType.StaticSuffix)),
    )

    describe(`when all maybe tokens are absent`, () => {
      const input = Input([{ type: TokenType.Spread }] as Token[])
      const result = parse(input)

      it(`successfully parses all tokens`, () => {
        expect(result).toMatchObject({
          right: [
            [empty, { type: TokenType.Spread }, empty],
            Input(input.tokens, 1),
          ],
        })
      })
    })

    describe(`when the first maybe token is present`, () => {
      const input = Input([
        { type: TokenType.StaticPrefix },
        { type: TokenType.Spread },
      ] as Token[])
      const result = parse(input)

      it(`successfully parses all tokens`, () => {
        expect(result).toMatchObject({
          right: [
            [
              { type: TokenType.StaticPrefix },
              { type: TokenType.Spread },
              empty,
            ],
            Input(input.tokens, 2),
          ],
        })
      })
    })

    describe(`when the second maybe token is present`, () => {
      const input = Input([
        { type: TokenType.Spread },
        { type: TokenType.StaticSuffix },
      ] as Token[])
      const result = parse(input)

      it(`successfully parses all tokens`, () => {
        expect(result).toMatchObject({
          right: [
            [
              empty,
              { type: TokenType.Spread },
              { type: TokenType.StaticSuffix },
            ],
            Input(input.tokens, 2),
          ],
        })
      })
    })

    describe(`when all tokens are present`, () => {
      const input = Input([
        { type: TokenType.StaticPrefix },
        { type: TokenType.Spread },
        { type: TokenType.StaticSuffix },
      ] as Token[])
      const result = parse(input)

      it(`successfully parses all tokens`, () => {
        expect(result).toMatchObject({
          right: [
            [
              { type: TokenType.StaticPrefix },
              { type: TokenType.Spread },
              { type: TokenType.StaticSuffix },
            ],
            Input(input.tokens, 3),
          ],
        })
      })
    })
  })
})

describe(parseSpreadNode.name, () => {
  const parse = parseSpreadNode

  describe(`without a prefix or suffix`, () => {
    const input = Input([{ type: TokenType.Spread }] as Token[])
    const result = parse(input)

    it(`parses the spread token into a spread node`, () => {
      expect(result).toMatchObject({
        right: [
          {
            type: NodeType.Spread,
            spreadToken: { type: TokenType.Spread },
          } as SpreadNode,
          Input(input.tokens, 1),
        ],
      })
    })
  })

  describe(`with a prefix and suffix`, () => {
    const input = Input([
      { type: TokenType.StaticPrefix },
      { type: TokenType.Spread },
      { type: TokenType.StaticSuffix },
    ] as Token[])
    const result = parse(input)

    it(`parses all tokens into a spread node`, () => {
      expect(result).toMatchObject({
        right: [
          {
            type: NodeType.Spread,
            spreadToken: { type: TokenType.Spread },
            prefixToken: { type: TokenType.StaticPrefix },
            suffixToken: { type: TokenType.StaticSuffix },
          } as SpreadNode,
          Input(input.tokens, 3),
        ],
      })
    })
  })
})

describe(`the finished parser`, () => {
  const tokens = [
    // block...
    /* 00 */ { type: TokenType.StaticLine },
    /* 01 */ { type: TokenType.StaticPrefix },
    /* 02 */ { type: TokenType.Expression },
    /* 03 */ { type: TokenType.StaticPrefix },
    /* 04 */ { type: TokenType.Expression },
    /* 05 */ { type: TokenType.StaticSuffix },
    /* 06 */ { type: TokenType.StaticPrefix },

    // slot...
    /* 07 */ { type: TokenType.Slot },

    // block...
    /* 08 */ { type: TokenType.StaticSuffix },
    /* 09 */ { type: TokenType.StaticLine },

    // spread...
    /* 10 */ { type: TokenType.StaticPrefix },
    /* 11 */ { type: TokenType.Spread },
    /* 12 */ { type: TokenType.StaticSuffix },

    // slot...
    /* 13 */ { type: TokenType.Slot },

    // slot...
    /* 14 */ { type: TokenType.Slot },

    // block...
    /* 15 */ { type: TokenType.StaticLine },

    // spread...
    /* 16 */ { type: TokenType.StaticPrefix },
    /* 17 */ { type: TokenType.Spread },
  ] as Token[]

  it(`works`, () => {
    const result = parse(tokens)

    expect(result).toMatchObject({
      right: [
        {
          type: NodeType.Block,
          tokens: [
            { type: TokenType.StaticLine },
            { type: TokenType.StaticPrefix },
            { type: TokenType.Expression },
            { type: TokenType.StaticPrefix },
            { type: TokenType.Expression },
            { type: TokenType.StaticSuffix },
            { type: TokenType.StaticPrefix },
          ],
        },
        { type: NodeType.Slot },
        {
          type: NodeType.Block,
          tokens: [
            { type: TokenType.StaticSuffix },
            { type: TokenType.StaticLine },
          ],
        },
        {
          type: NodeType.Spread,
          prefixToken: { type: TokenType.StaticPrefix },
          spreadToken: { type: TokenType.Spread },
          suffixToken: { type: TokenType.StaticSuffix },
        },
        { type: NodeType.Slot },
        { type: NodeType.Slot },
        { type: NodeType.Block },
        {
          type: NodeType.Spread,
          prefixToken: { type: TokenType.StaticPrefix },
          spreadToken: { type: TokenType.Spread },
        },
      ],
    })
  })
})
