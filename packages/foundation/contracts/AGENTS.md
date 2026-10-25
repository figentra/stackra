# AGENTS — @stackra/contracts

The leaf vocabulary of Stackra. Member at `packages/foundation/contracts` (`tier:lib`), in the programming model v3
shape (ADR 0294, 0295). Entry `.` only.

## Where code goes

| You are writing…               | It goes in…                                 |
| ------------------------------ | ------------------------------------------- |
| A kind base (`Port`, `Enum`)   | `src/core/bases/<name>.base.ts`             |
| A platform enum                | `src/core/enums/<name>.enum.ts` (`Enum.of`) |
| A core port                    | `src/core/ports/<name>.port.ts`             |
| A shared type                  | `src/core/types/<name>.type.ts`             |
| A value namespace (`Duration`) | `src/core/constants/<name>.constant.ts`     |
| A function                     | `src/core/functions/<name>.function.ts`     |
| A test                         | `__tests__/<name>.<kind>.test.ts` beside it |

The whole package is one `.` entry, so its enums, ports and types sit under `src/core/`, not `src/contracts/`: a
`src/contracts/` folder would become a `./contracts` entry, and consumers import `@stackra/contracts`.

## Entries and barrels

- `src/core/index.ts` is a stand-in barrel (`Purpose: Stand-in barrel:`) until gen writes the entry barrels (STA-339);
  add every new public file to it and to the export list in `src/core/__tests__/index.test.ts`.
- `stackra.config.ts` imports `definePackage` from this package by name, like every other member.

## This package

- Zero workspace dependencies at runtime. A new import from another `@stackra/*` package here is a cycle: every
  foundation package depends on this one.
- Only add a symbol a consumer imports today (the template, a wave-1 package, or a registry row).
- A kind base assigns no fields in its constructor and keeps no state (0294 decision 25); brands are `declare`d,
  type-only `~kind` and `~brand` keys.
- `Enum.of` codes are snake_case except a tool-owned value (`HttpMethod`), which keeps the tool's spelling.
- `Duration` values are canonical ISO 8601 strings; keep `Duration.*` pure, because gen evaluates them in defaults.

## Rules that fail the build

- A package never imports an app, a service, `encore.dev`/`~encore/*`, or another package's `src/`.
- Versions are `catalog:<name>` or `workspace:*` only. Imports leaving a folder use the `#core/*` alias.
- No `enum`, no `#private` fields, no parameter properties (`erasableSyntaxOnly`), no `*.stories.*`.
- Coverage meets the shared gate (lines/functions 80, branches 70).

## Tasks

`pnpm turbo run <task> --filter=@stackra/contracts` — `build`, `typecheck`, `lint`, `test`, `test:coverage`,
`format`, `format:check`, `clean`.

## PII

| Data | Where | Handling                                                                                    |
| ---- | ----- | ------------------------------------------------------------------------------------------- |
| None | —     | Types only: `Actor`, `Email` and `VerifiedPrincipal` describe personal data but store none. |
