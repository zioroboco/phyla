export interface Token {
  type: TokenType
  image: string
  value: string
  line: number
  col: number
}

export enum TokenType {
  Expression = "Expression",
  SlotExpression = "SlotExpression",
  SpreadExpression = "SpreadExpression",
  StaticLine = "StaticLine",
  StaticPostfix = "StaticPostfix",
  StaticPrefix = "StaticPrefix",
}
