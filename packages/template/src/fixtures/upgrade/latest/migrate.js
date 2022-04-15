/** @type {import("../../..").Migrate} */
export const migrate = {
  slots: from => from === "stuff" ? "scripts" : "default",
  variables: from => ({
    ...from,
    package: {
      name: from.package.name ?? from.name
    }
  })
}
