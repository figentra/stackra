# AGENTS — @stackra/container

The DI container and the kind machinery every kind package builds on. Member at `packages/foundation/container`
(`tier:lib`), in the programming model v3.1 shape (ADR 0294, 0305). Entries `.`, `./react`, `./testing`.

## Where code goes

| You are writing…                                        | It goes in…                                          |
| ------------------------------------------------------- | ---------------------------------------------------- |
| A kind base (`Module`, `Service`, `Explorer`, `Driver`) | `src/core/bases/<name>.base.ts`                      |
| A facet decorator (`Lifetime`, `Replaces`)              | `src/core/decorators/<name>.decorator.ts`            |
| A runtime class (`Container`, `DiscoveryService`)       | `src/core/services/<name>.service.ts`                |
| A built-in driver                                       | `src/core/drivers/<name>.driver.ts` (not exported)   |
| A function, a type, a constant, an enum, an error       | `src/core/{functions,types,constants,enums,errors}/` |
| React code                                              | `src/react/<name>/`                                  |
| The testing module and its extension point              | `src/testing/{functions,services,types,constants}/`  |
| A test                                                  | `__tests__/<name>.<kind>.test.ts(x)` beside it       |

## Entries and barrels

- `src/core/index.ts`, `src/react/index.ts` and `src/testing/index.ts` are stand-in barrels until gen writes the
  entry barrels (STA-339); add every new public file to its barrel and to that entry's `index.test.ts`.
- `./react` and `./testing` import `.` through `#core/*`; `.` never imports them. No symbol is exported twice.

## This package

- Runtime dependency: `@stackra/contracts` only (`Port`, `Enum`, `Clock`). Never `reflect-metadata`, never a
  `design:*` read, never a string token.
- A kind base assigns no fields in its constructor and keeps no state (0294 decision 25); brands are `declare`d,
  type-only `~kind` keys.
- `createDecorator` decorators record only: no accessor, no wrapper. The acting half is an Explorer.
- `UnresolvedPortError` stays a plain `Error`: `@stackra/errors` depends on this package.
- No parameter properties and no `#private` fields: apps typecheck this source under `erasableSyntaxOnly`.
- Only add a symbol a consumer imports today (the template, a wave-1 package, or the registry row).

## Rules that fail the build

- A package never imports an app, a service, `encore.dev`/`~encore/*`, or another package's `src/`.
- Versions are `catalog:<name>` or `workspace:*` only.
- Coverage meets the shared gate (lines/functions 80, branches 70).

## Tasks

`pnpm turbo run <task> --filter=@stackra/container` — `build`, `typecheck`, `lint`, `test`, `test:coverage`,
`format`, `format:check`, `clean`.

## PII

| Data | Where | Handling                                                   |
| ---- | ----- | ---------------------------------------------------------- |
| None | —     | The container holds instances; it stores and logs no data. |
