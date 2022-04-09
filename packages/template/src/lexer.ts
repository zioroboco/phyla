import { Lexer, createToken } from "chevrotain"

export enum TokenType {
  Static = "Static",
  Placeholder = "Placeholder",
}

export const lexer = new Lexer([
  createToken({
    name: TokenType.Placeholder,
    pattern: /{{(?:.|\n)+}}/,
    line_breaks: true,
  }),
  createToken({
    name: TokenType.Static,
    pattern: /(?:.|\n)+/,
    line_breaks: true,
  }),
])
