module.exports = function () {
  return {
    autoDetect: true,
    files: [
      "./package.json",
      "./{examples,packages}/*/src/**/*.{ts,json}",
      "!./{examples,packages}/*/src/**/*.spec.ts",
      "!./node_modules/**/*"
    ],
    tests: [
      "./{examples,packages}/*/src/**/*.spec.ts",
      "!./node_modules/**/*",
    ],
    runMode: "onsave",
    testFramework: "jest",
    workers: { restart: true },
    env: {
      type: "node",
      runner: "/usr/local/bin/node",
      params: {
        runner: "--experimental-vm-modules --no-warnings",
      },
    },
  }
}
