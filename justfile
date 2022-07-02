CI := env_var_or_default("CI", "false")

install:
    pnpm install --loglevel=error

build: install
    pnpm tsc --build

clean: install
    pnpm tsc --build --clean

format: install
    pnpm dprint {{ if CI == "true" { "check" } else { "fmt" } }}

test: install
    pnpm run --recursive test

release: install build
    pnpm changeset publish

version: install
    changeset version
    pnpm install
