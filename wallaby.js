module.exports = function () {
  return {
    files: [
      "./package.json",
      "./{examples,packages}/*/src/**/*.{ts,json}",
      "!./{examples,packages}/*/src/**/*.spec.ts",
      "!./node_modules/**/*",
    ],
    tests: ["./{examples,packages}/*/src/**/*.spec.ts", "!./node_modules/**/*"],
    runMode: "onsave",
    testFramework: "mocha",
    workers: { restart: true },
    env: {
      type: "node",
      runner: "/usr/local/bin/node",
      params: {
        runner: [
          "--experimental-import-meta-resolve",
          "--experimental-specifier-resolution=node",
          "--no-warnings",
        ].join(" "),
      },
    },
  }
}
