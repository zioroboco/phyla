import { describe, it } from "mocha"
import expect from "expect"

import { lex } from "./parser"

describe(lex.name, () => {
  it(`lexes static text`, () => {
    expect(lex("blep")).toMatchObject({
      right: [{
        type: "static",
        value: "blep",
        text: "blep",
        line: 1,
        col: 1,
      }],
    })
  })

  it(`lexes an expression`, () => {
    expect(lex("{{ blep }}")).toMatchObject({
      right: [{
        type: "expression",
        value: "blep",
        text: "{{ blep }}",
        line: 1,
        col: 1,
      }],
    })
  })

  it(`lexes a spread expression`, () => {
    expect(lex("{{ ...blep }}")).toMatchObject({
      right: [{
        type: "spread",
        value: "blep",
        text: "{{ ...blep }}",
        line: 1,
        col: 1,
      }],
    })
  })

  it(`lexes a multiline expression`, () => {
    const input = `{{
      blep
    }}`
    expect(lex(input)).toMatchObject({
      right: [{
        type: "expression",
        value: "blep",
        text: input,
        line: 1,
        col: 1,
      }],
    })
  })

  it(`lexes a multiline spread expression`, () => {
    const input = `{{
      ...blep
    }}`
    expect(lex(input)).toMatchObject({
      right: [{
        type: "spread",
        value: "blep",
        text: input,
        line: 1,
        col: 1,
      }],
    })
  })

  it(`lexes a slot`, () => {
    expect(lex("{{ slot: blep }}")).toMatchObject({
      right: [{
        type: "slot",
        value: "blep",
        text: "{{ slot: blep }}",
        line: 1,
        col: 1,
      }],
    })
  })

  it(`errors on invalid syntax`, () => {
    const invalid = [
      `{{ }}`,
      `{{ ... }}`,
      `{{ slot: }}`,
    ]
    for (const input of invalid) {
      const result = lex(input)
      expect(result).toMatchObject({
        left: expect.objectContaining({
          message: expect.stringMatching(
            /invalid syntax at line 1 col 1/
          ),
        }),
      })
    }
  })
})
