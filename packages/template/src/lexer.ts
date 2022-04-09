import { Lexer, createToken } from "chevrotain"

export enum TokenType {
  StaticEmpty = "StaticEmpty",
  StaticLine = "StaticLine",
  StaticPrefix = "StaticPrefix",
  StaticPostfix = "StaticPostfix",
  Placeholder = "Placeholder",
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
    name: TokenType.StaticEmpty,
    pattern: /\n/,
    line_breaks: true,
  }),
])
