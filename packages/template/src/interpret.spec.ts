import { describe, expect, it } from "@jest/globals"
import { interpret } from "./interpret.js"

describe(`expecting no template variables`, () => {
  const template = `blah blah`

  it(`returns the template verbatim`, () => {
    expect(interpret(template)).toMatchObject({
      right: template })
  })

  describe(`when provided variables`, () => {
    const variables = { bee: "🐝" }

    it(`ignores any variables and returns the template verbatim`, () => {
      expect(interpret(template, { variables })).toMatchObject({
        right: template,
      })
    })
  })
})

describe(`expecting a single template variable`, () => {
  const template = `blah {{bee}} blah`

  describe(`when provided a value for the variable`, () => {
    const variables = { bee: "🐝" }

    it(`returns the template with the value interpolated`, () => {
      expect(interpret(template, { variables })).toMatchObject({
        right: `blah 🐝 blah`,
      })
    })
  })

  describe(`when the variable is not defined`, () => {
    const variables = {}

    it(`returns an error including the missing variable name`, () => {
      expect(interpret(template, variables)).toMatchObject({
        left: [
          expect.objectContaining({
            name: "ReferenceError",
            message: "bee is not defined",
          }),
        ],
      })
    })
  })
})

describe(`expecting a single template variable (including whitespace)`, () => {
  const template = `blah {{ bee }} blah`

  describe(`when provided a value for the variable`, () => {
    const variables = { bee: "🐝" }

    it(`returns the template with the value interpolated`, () => {
      expect(interpret(template, { variables })).toMatchObject({
        right: `blah 🐝 blah`,
      })
    })
  })

  describe(`when the variable is not defined`, () => {
    const variables = {}

    it(`returns an error including the missing variable name`, () => {
      expect(interpret(template, variables)).toMatchObject({
        left: [
          expect.objectContaining({
            name: "ReferenceError",
            message: "bee is not defined",
          }),
        ],
      })
    })
  })
})

describe(`expecting multiple template variables`, () => {
  const template = `{{bee}} {{ladybird}}`

  describe(`when provided values for all variables`, () => {
    const variables = {
      bee: "🐝",
      ladybird: "🐞",
    }

    it(`returns the template with all values interpolated`, () => {
      const result = interpret(template, { variables })
      expect(result).toMatchObject({
        right: `🐝 🐞`,
      })
    })
  })

  describe(`when all variables are not defined`, () => {
    const variables = {}

    it(`returns errors including the names of all missing variables`, () => {
      const result = interpret(template, variables)
      expect(result).toMatchObject({
        left: ["bee", "ladybird"].map(key =>
          expect.objectContaining({
            name: "ReferenceError",
            message: `${key} is not defined`,
          })),
      })
    })
  })
})

describe(`rendering arrays`, () => {
  const variables = {
    items: ["🐝", "🐞"],
  }

  describe(`expecting a simple variable`, () => {
    const template = `title:\n{{items}}`

    it(`renders the array as a string`, () => {
      const result = interpret(template, { variables })
      expect(result).toMatchObject({
        right: `title:\n🐝,🐞`,
      })
    })
  })

  describe(`using the spread operator`, () => {
    const template = `title:\n{{...items}}`

    it(`renders elements to separate lines`, () => {
      const result = interpret(template, { variables })
      expect(result).toMatchObject({
        right: `title:\n🐝\n🐞`,
      })
    })

    it(`renders elements to separate lines with a custom separator`, () => {
      const result = interpret(template, { variables, separator: ",\n" })
      expect(result).toMatchObject({
        right: `title:\n🐝,\n🐞`,
      })
    })

    describe(`with something other than an array`, () => {
      const variables = {
        items: "🐝🐝🐝",
      }

      it(`returns an error`, () => {
        const result = interpret(template, { variables })
        expect(result).toMatchObject({
          left: [
            expect.objectContaining({
              name: "TemplateError",
              message: expect.stringContaining("items"),
            }),
          ],
        })
      })
    })
  })
})

describe("tags", () => {
  const template = `blah {{ tagged: bee }} blah`

  describe("with a transform function", () => {
    const transform = (tag: string, value: string) => {
      expect(tag).toBe("tagged")
      expect(value).toBe("bee")
      return "🐝"
    }

    it(`transforms the tagged value`, () => {
      expect(interpret(template, { transform })).toMatchObject({
        right: `blah 🐝 blah`,
      })
    })

    describe("without a transform function", () => {
      it(`returns an error including the tag type`, () => {
        expect(interpret(template)).toMatchObject({
          left: [
            expect.objectContaining({
              name: "TemplateError",
              message: expect.stringContaining("tagged"),
            }),
          ],
        })
      })
    })
  })
})

describe(`combining features`, () => {
  const variables = { workspaces: ["one", "two"] }

  it(`renders a json example`, () => {
    const template = `{\n  "workspaces": [\n    {{ ...workspaces.map(ws => \`"\${ws}"\`) }}\n  ]\n}`

    const result = interpret(template, { variables, separator: ",\n" })
    expect(result).toMatchObject({
      right: `{\n  "workspaces": [\n    "one",\n    "two"\n  ]\n}`,
    })
  })
})
