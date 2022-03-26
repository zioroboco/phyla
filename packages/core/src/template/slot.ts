type SlotToken = { slot: string }
type SplitTemplate = Array<string | SlotToken>

export function split (template: string): SplitTemplate {
  const match = template.match(/{{[ ]*slot:[ ]*(\w+?)[ ]}}/)
  if (!match) {
    return [template]
  } else {
    return [
      template.slice(0, match.index),
      { slot: match[1] },
      ...split(template.slice(match.index! + match[0].length)),
    ]
  }
}
