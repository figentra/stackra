# AGENTS — @stackra/reports

Module reports: the `Report<Source>({ key, dimensions, measures, defaultFilter, permission })` kind base, its closed
vocabulary and the `ReportRunner` port (ADR 0470). Member at `packages/data/reports` (`tier:lib`), in the programming
model v3.1 shape (ADR 0294, 0305). Entries `.` and `./node` (the Postgres report compiler, stackra-390).

## Where code goes

| You are writing… | It goes in…                                 |
| ---------------- | ------------------------------------------- |
| The kind base    | `src/core/bases/report.base.ts`             |
| An enum          | `src/core/enums/<name>.enum.ts`             |
| A pure function  | `src/core/functions/<name>.function.ts`     |
| A port           | `src/core/ports/<name>.port.ts`             |
| A type           | `src/core/types/<name>.type.ts`             |
| The compiler     | `src/node/drivers`, `src/node/functions`    |
| Its config       | `src/node/{config,constants,schemas}`       |
| A test           | `__tests__/<name>.<kind>.test.ts` beside it |

## Entries and barrels

- `src/core/index.ts` is a stand-in barrel until gen writes the entry barrels (STA-339); add every new public file to
  it and to the export list in `src/core/__tests__/index.test.ts`.
- `ReportBase` is exported as a type only.
- `src/node/index.ts` is the `./node` stand-in barrel; keep `src/node/__tests__/index.test.ts` in step.

## This package

- The vocabulary is closed (ADR 0470 decision 2). Adding a grain, measure kind or metric changes the enum, its test in
  `index.test.ts`, gen's `reportsOf` and the README in the same commit.
- A formula is checked by `formulaNames`, never evaluated as code; never widen the grammar to function calls or paths.
- `Report` checks shape only; whether a path exists on the source is gen's check.
- Never name anything Tenant here (ADR 0323); a report runs under the caller's session and scope.
- The compiler writes no caller value into SQL text: names are looked up in the declaration, columns come from the
  metadata (checked identifiers), grains are enum values, the time zone is checked, and every filter value is bound.
  Keep the select and grouping text free of bound values so the grouping expressions match.
- Never import `@mikro-orm/*` here (ADR 0097); read the ORM through `Database.em()` and `@stackra/database` exports.

## Rules that fail the build

- A package never imports an app, a service, `encore.dev`/`~encore/*`, or another package's `src/`.
- Versions are `catalog:<name>` or `workspace:*` only. Imports leaving a folder use the `#core/*` alias.
- No `enum`, no `#private` fields, no parameter properties.
- Coverage meets the shared gate (lines/functions 80, branches 70).

## Tasks

`pnpm turbo run <task> --filter=@stackra/reports` — `build`, `typecheck`, `lint`, `test`, `test:coverage`, `format`,
`format:check`, `clean`.

## PII

| Data        | Where          | Handling                                                                                   |
| ----------- | -------------- | ------------------------------------------------------------------------------------------ |
| Report rows | `ReportResult` | Grouped values of declared dimensions and measures only; column visibility is stackra-395. |
