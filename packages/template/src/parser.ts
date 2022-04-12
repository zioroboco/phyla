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


function success <A> (a: A): Parser<A> {
  return input =>
    E.right([a, input])
}

function failure (message: string): Parser<never> {
  return input =>
    E.left(ParseError(message, input))
}

export function some <A> (...fas: ReadonlyArray<Parser<A>>): Parser<A> {
  return pipe(
    fas,
    RA.foldLeft(
      () => failure("no parser succeeded"),
      (fa: Parser<A>, tail: ReadonlyArray<Parser<A>>) => input =>
        pipe(
          fa(input),
          E.fold(() => some(...tail)(input), E.right)
        )
    )
  )
}

function product<A, B> (fa: Parser<A>, fb: Parser<B>): Parser<readonly [A, B]> {
  return input =>
    pipe(
      fa(input),
      E.chain(([a, inputAfterA]) =>
        pipe(
          fb(inputAfterA),
          E.map(([b, inputAfterB]) => [[a, b] as const, inputAfterB])
        )
      )
    )
}

export function sequence<A> (
  ...fas: ReadonlyArray<Parser<A>>
): Parser<ReadonlyArray<A>> {
  return pipe(
    fas,
    RA.reduce(success<ReadonlyArray<A>>([]), (parser, fa) =>
      pipe(
        product(parser, fa),
        map(([result, a]) => RA.append(a)(result))
      )
    )
  )
}

export function many <A> (fa: Parser<A>): Parser<ReadonlyArray<A>> {
  return input =>
    pipe(
      fa(input),
      E.map(([a, inputAfterA]) => [[a], inputAfterA] as const),
      E.chain(([a, inputAfterA]) =>
        pipe(
          some(many(fa), success<ReadonlyArray<A>>([]))(inputAfterA),
          E.map(([b, inputAfterB]) => [a.concat(b), inputAfterB])
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
