import { Lexer, createToken } from "chevrotain"

export enum TokenType {
  Expression = "Expression",
  SlotExpression = "SlotExpression",
  SpreadExpression = "SpreadExpression",
  StaticLine = "StaticBlankLine",
  StaticPostfix = "StaticPostfix",
  StaticPrefix = "StaticPrefix",
}

export const lexer = new Lexer([
  createToken({
    name: TokenType.SlotExpression,
    pattern: /{{[ ]*slot:[ ]*\w+[ ]*}}/,
    line_breaks: false,
  }),
  createToken({
    name: TokenType.SpreadExpression,
    pattern: /{{[ \t\n]*\.{3}[a-zA-Z$_](?:.|\n)*?}}/,
    line_breaks: true,
  }),
  createToken({
    name: TokenType.Expression,
    pattern: /{{(?:.|\n)+?}}/,
    line_breaks: true,
  }),
  createToken({
    name: TokenType.StaticPrefix,
    pattern: /.+?(?={{)/,
    line_breaks: false,
  }),
  createToken({
    name: TokenType.StaticPostfix,
    pattern: /(?<=}}).*\n?/,
    line_breaks: true,
  }),
  createToken({
    name: TokenType.StaticLine,
    pattern: /\n|.+\n?/,
    line_breaks: true,
  }),
])
