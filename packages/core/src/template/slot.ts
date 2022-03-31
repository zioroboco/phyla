type Token = { type: "slot", id: string }
type SplitTemplate = Array<string | Token>

export function split (template: string): SplitTemplate {
  const match = template.match(/{{[ ]*slot:[ ]*(\w+)[ ]*}}/)
  if (!match) {
    return [template]
  } else {
    return [
      template.slice(0, match.index),
      { type: "slot", id: match[1] },
      ...split(template.slice(match.index! + match[0].length)),
    ]
  }
}
