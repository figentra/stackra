# AGENTS — @stackra/config

Configuration classes, secret references and env hydration. Member at `packages/foundation/config` (`tier:lib`), in
the programming model v3.1 shape (ADR 0294, 0305). Entries `.`, `./contracts`, `./react`, `./testing`.

## Where code goes

| You are writing…                        | It goes in…                                               |
| --------------------------------------- | --------------------------------------------------------- |
| The kind base (`Config`)                | `src/core/bases/config.base.ts`                           |
| A decorator                             | `src/core/decorators/<name>.decorator.ts`                 |
| A port (the `./contracts` entry)        | `src/contracts/ports/<name>.port.ts`                      |
| A function, a type, a constant, a error | `src/core/{functions,types,constants,errors}/`            |
| React code                              | `src/react/<name>/`                                       |
| The testing plugin                      | `src/testing/constants/config-testing-plugin.constant.ts` |
| A test                                  | `__tests__/<name>.<kind>.test.ts(x)` beside it            |

## Entries and barrels

- `src/{core,contracts,react,testing}/index.ts` are stand-in barrels until gen writes the entry barrels (STA-339); add every new
  public file to its barrel and to that entry's `index.test.ts`.
- The old `./env` entry is folded into `.`; `MigrationRunner` lives in `@stackra/contracts`.
- `./testing` registers its plugin when imported; `sideEffects` stays `false` (only vitest loads it).

## This package

- Layers apply in one fixed order: schema defaults, host override, `env`, values (runway or a test), secrets. Never
  add a layer or a deep merge: a nested object is replaced whole (ADR 0294 decision 19).
- A secret value is never stored enumerable, logged, put in an error or accepted from `env`/values. `ConfigIssue`
  holds paths and names only. Tests assert a canary value never reaches any output.
- A secret store driver reads values only in `load()`, keeps them in a private map and names steps, statuses or ids in
  its errors, never a value. Tests use made-up canaries and assert they never reach an error.
- The key comes from `configKey` only; gen calls the same function. Never add a `key` option.
- `hydrateEnv(..., { only: "public" })` reads public-prefixed variables only (`PUBLIC_ENV_PREFIXES`).
- No parameter properties and no `#private` fields: apps typecheck this source under `erasableSyntaxOnly`.

## Rules that fail the build

- A package never imports an app, a service, `encore.dev`/`~encore/*`, or another package's `src/`.
- Versions are `catalog:<name>` or `workspace:*` only.
- Coverage meets the shared gate (lines/functions 80, branches 70).

## PII and secrets

| Data          | Where                           | Handling                                                                     |
| ------------- | ------------------------------- | ---------------------------------------------------------------------------- |
| Secret values | `@Secret` fields, `SecretStore` | Resolved blind, non-enumerable getter, never serialised or logged (ADR 0173) |
| Config values | configuration instances         | Deploy-time, never per tenant; no personal data belongs here                 |
