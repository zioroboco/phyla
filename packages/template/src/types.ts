import * as O from "fp-ts/Option"

export type Token =
  | ExpressionToken
  | SlotExpressionToken
  | SpreadExpressionToken
  | StaticLineToken
  | StaticPostfixToken
  | StaticPrefixToken

export type TokenProperties = {
  image: string
  value: string
  line: number
  column: number
}

export enum TokenType {
  Expression = "Expression",
  SlotExpression = "SlotExpression",
  SpreadExpression = "SpreadExpression",
  StaticLine = "StaticLine",
  StaticPostfix = "StaticPostfix",
  StaticPrefix = "StaticPrefix",
}

export type ExpressionToken = TokenProperties & {
  type: TokenType.Expression
}

export type SlotExpressionToken = TokenProperties & {
  type: TokenType.SlotExpression
}

export type SpreadExpressionToken = TokenProperties & {
  type: TokenType.SpreadExpression
}

export type StaticLineToken = TokenProperties & {
  type: TokenType.StaticLine
}

export type StaticPostfixToken = TokenProperties & {
  type: TokenType.StaticPostfix
}

export type StaticPrefixToken = TokenProperties & {
  type: TokenType.StaticPrefix
}

export enum NodeType {
  Block = "Block",
  Slot = "Slot",
  Spread = "Spread",
}

export type Node = BlockNode | SlotNode | SpreadNode

export type BlockNode = {
  type: NodeType.Block
  tokens: (
    | ExpressionToken
    | StaticLineToken
    | StaticPostfixToken
    | StaticPrefixToken
  )[]
}

export type SlotNode = {
  type: NodeType.Slot
  expression: SlotExpressionToken
}

export type SpreadNode = {
  type: NodeType.Spread,
  prefix: O.Option<StaticPrefixToken>,
  expression: SpreadExpressionToken,
  postfix: O.Option<StaticPostfixToken>,
}
