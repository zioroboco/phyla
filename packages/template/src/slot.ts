export function slotted (
  input: string,
): (string | { slot: string })[] {
  const match = input.match(/{{[ ]*slot:[ ]*(\w+?)[ ]}}/)
  if (!match) {
    return [input]
  } else {
    return [
      input.slice(0, match.index),
      { slot: match[1] },
      ...slotted(input.slice(match.index! + match[0].length)),
    ]
  }
}
