# AGENTS — @stackra/registry

Module catalogue validation for a registry service. Member at `packages/application/registry` (`tier:lib`), in the
programming model v3.1 shape (ADR 0294, 0305). Entry `.` only.

## Where code goes

| You are writing…                 | It goes in…                                 |
| -------------------------------- | ------------------------------------------- |
| A shape (`CatalogueManifest`)    | `src/core/schemas/<name>.schema.ts`         |
| Its shipped schema or a constant | `src/core/constants/<name>.constant.ts`     |
| An enum                          | `src/core/enums/<name>.enum.ts`             |
| A function                       | `src/core/functions/<name>.function.ts`     |
| A type                           | `src/core/types/<name>.type.ts`             |
| A test                           | `__tests__/<name>.<kind>.test.ts` beside it |

## Entries and barrels

- `src/core/index.ts` is a stand-in barrel until gen writes the entry barrels (STA-339); add every new public file to
  it and to the export list in `src/core/__tests__/index.test.ts`.

## This package

- Runtime dependencies are `@stackra/contracts`, `@stackra/validation` and `zod` only.
- `validateCatalogue`, `canTransitionReview` and `planEditionInstall` are pure and never throw on untrusted input. Any new check keeps the output independent of input
  order: walk manifests in the sorted order, and compare strings by code unit, never with `localeCompare`.
- A new diagnostic code is a new case of `CatalogueDiagnosticCode`, snake_case.
- Configuration, not code: fee rates, sandbox counts and lifetimes, and review rules are records and settings the
  service passes in; only the transitions, the arithmetic and the install order live here.
- Only add a symbol a consumer imports today (the template, a package, or the registry row).

## Rules that fail the build

- A package never imports an app, a service, `encore.dev`/`~encore/*`, or another package's `src/`.
- Versions are `catalog:<name>` or `workspace:*` only. Imports leaving a folder use the `#core/*` alias.
- No `enum`, no `#private` fields, no parameter properties, no `*.stories.*`.
- Coverage meets the shared gate (lines/functions 80, branches 70).

## Tasks

`pnpm turbo run <task> --filter=@stackra/registry` — `build`, `typecheck`, `lint`, `test`, `test:coverage`, `format`,
`format:check`, `clean`.

## PII

| Data | Where                                                                       | Handling                                                         |
| ---- | --------------------------------------------------------------------------- | ---------------------------------------------------------------- |
| Ids  | `AppReview.reviewer`, `DeveloperSandbox.developer`, `PartnerPayout.partner` | Principal and organisation public ids only; nothing stored here. |
