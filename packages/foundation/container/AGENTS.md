# AGENTS — @stackra/container

<!--
Stackra file contract:
Purpose: the agent rules of @stackra/container: where code goes, entries and barrels, the package rules (tokens,
         kind bases, decorators, the multi-binding) and the rules that fail the build.
Boundary: documentation only; the code and the ADRs win on any difference.
Runtime: none
Governing contract: ADR 0263; ADR 0294; ADR 0305; ADR 0457.
-->

The DI container and the kind machinery every kind package builds on. Member at `packages/foundation/container`
(`tier:lib`), in the programming model v3.1 shape (ADR 0294, 0305). Entries `.`, `./devtools`, `./react`, `./testing`.

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
- A multi-binding is a base class and its booted subclasses (`getAll(Base)`, ADR 0457); never add a multi token, an
  array token or a contributions section to the wiring.
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

## Devtools

- `./devtools` is the dev-only devtools entry (ADR 0246 decision 4): `defineContainerDevtools(kit, container)` defines `container.bindings` (read from `Container.bindings()`) on the kit, data only. No
  UI, no `@stackra-pro/*` import (ADR 0461: the panel UI is Pro, the data is free). Nothing in `.` or a production path
  imports `./devtools`.
- It takes the kit by shape, `DevtoolsTabSink` from `@stackra/container/devtools`, never `@stackra/devtools-kit`
  (the kit depends on container and events, so a dependency on it would close a cycle).
- Tab ids are dotted lowercase, `container.*` first. A tab that carries inputs, payloads or personal data sets
  `sensitive: true`.
- ADR 0127 does not list `./devtools` among the allowed entries and gen's `entryOf` does not know it yet; the barrel
  is a hand-written stand-in until both are settled (see the stackra-208 hand-off).

## PII

| Data | Where | Handling                                                   |
| ---- | ----- | ---------------------------------------------------------- |
| None | —     | The container holds instances; it stores and logs no data. |
