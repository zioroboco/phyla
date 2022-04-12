import * as O from "fp-ts/Option"

export type Token = {
  type: TokenType,
  image: string
  value: string
  line: number
  column: number
}

export enum TokenType {
  Expression = "Expression",
  Slot = "Slot",
  Spread = "Spread",
  StaticLine = "StaticLine",
  StaticPrefix = "StaticPrefix",
  StaticSuffix = "StaticSuffix",
}

export enum NodeType {
  Block = "Block",
  Slot = "Slot",
  Spread = "Spread",
}

export type Node = BlockNode | SlotNode | SpreadNode

export type BlockNode = {
  type: NodeType.Block
  tokens: readonly Token[]
}

export type SlotNode = {
  type: NodeType.Slot
  token: Token
}

export type SpreadNode = {
  type: NodeType.Spread,
  prefixToken: O.Option<Token>,
  expressionToken: Token,
  suffixToken: O.Option<Token>,
}
