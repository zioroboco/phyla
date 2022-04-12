import * as E from "fp-ts/Either"
import * as O from "fp-ts/Option"
import * as RA from "fp-ts/ReadonlyArray"
import { pipe } from "fp-ts/function"

import { NodeType, SlotNode, Token, TokenType } from "./types"

export interface Input {
  readonly tokens: ReadonlyArray<Token>
  readonly index: number
}

export function Input (tokens: ReadonlyArray<Token>, index: number = 0): Input {
  return { tokens, index }
}

type Parser<A> = (input: Input) => E.Either<ParseError, readonly [A, Input]>

interface ParseError {
  readonly message: string
  readonly input: Input
}

function ParseError (message: string, input: Input): ParseError {
  return { message, input }
}

function advance (input: Input): O.Option<[Token, Input]> {
  return input.tokens.length > input.index
    ? O.some([input.tokens[input.index], Input(input.tokens, input.index + 1)])
    : O.none
}

export function parseTokenType (expected: TokenType): Parser<Token> {
  return input =>
    pipe(
      advance(input),
      O.fold(
        () => E.left(ParseError(`unexpected end of input`, input)),
        ([token, input]) =>
          token.type === expected
            ? E.right([token, input] as const)
            : E.left(
              ParseError(
                `expected token of type ${expected}, got ${token.type}`,
                input
              )
            )
      )
    )
}

function map <A, B> (f: (a: A) => B) {
  return (fa: Parser<A>): Parser<B> =>
    (input: Input) =>
      pipe(
        fa(input),
        E.map(([a, nextInput]) => [f(a), nextInput])
      )
}

function failParser (message: string): Parser<never> {
  return input =>
    E.left(ParseError(message, input))
}

export function either <A> (...fas: ReadonlyArray<Parser<A>>): Parser<A> {
  return pipe(
    fas,
    RA.foldLeft(
      () => failParser("no parser succeeded"),
      (fa: Parser<A>, tail: ReadonlyArray<Parser<A>>) => input =>
        pipe(
          fa(input),
          E.fold(() => either(...tail)(input), E.right)
        )
    )
  )
}

export const parseSlotNode = pipe(
  parseTokenType(TokenType.SlotExpression),
  map(
    (token: Token): SlotNode => ({
      type: NodeType.Slot,
      token,
    })
  )
)
