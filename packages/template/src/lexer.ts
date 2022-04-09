import { Lexer, createToken } from "chevrotain"

export enum TokenType {
  Placeholder = "Placeholder",
  StaticBlankLine = "StaticEmpty",
  StaticLine = "StaticBlankLine",
  StaticPostfix = "StaticPostfix",
  StaticPrefix = "StaticPrefix",
}

export const lexer = new Lexer([
  createToken({
    name: TokenType.Placeholder,
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
    pattern: /.+\n?/,
    line_breaks: true,
  }),
  createToken({
    name: TokenType.StaticBlankLine,
    pattern: /\n/,
    line_breaks: true,
  }),
])
