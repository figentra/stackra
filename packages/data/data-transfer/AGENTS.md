# AGENTS — @stackra/data-transfer

Tabular import and export (ADR 0367, ADR 0163 decisions 3 and 4). Member at `packages/data/data-transfer`
(`tier:lib`), in the programming model v3.1 shape (ADR 0294, 0305). Entries `.`, `./contracts` and `./node` (XLSX only; ADR 0431).

## Where code goes

| You are writing…        | It goes in…                                    |
| ----------------------- | ---------------------------------------------- |
| A port                  | `src/contracts/ports/<name>.port.ts`           |
| A contract type or enum | `src/contracts/{types,enums}/<name>.<kind>.ts` |
| A format or ledger      | `src/core/drivers/<name>.driver.ts`            |
| An exceljs format       | `src/node/drivers/<name>.driver.ts`            |
| Seed data (profiles)    | `assets/data/<kind>/<name>.yaml`               |
| The import engine       | `src/core/services/import-runner.service.ts`   |
| A function              | `src/core/functions/<name>.function.ts`        |
| A refusal               | `src/core/errors/<name>.error.ts`              |
| A type or constant      | `src/core/{types,constants}/<name>.<kind>.ts`  |
| A test                  | `__tests__/<name>.<kind>.test.ts` beside it    |

## Entries and barrels

- `src/contracts/index.ts`, `src/core/index.ts` and `src/node/index.ts` are stand-in barrels until gen writes the entry barrels (STA-339);
  add every new public file to one of them and to the export list in that entry's `__tests__/index.test.ts`.
- Ports, `ImportRunState` and contract types are exported from `./contracts` only. The CSV parser, the decoder, the
  byte limiter, cell conversions and constants stay internal.

## This package

- Configuration, not code (ADR 0363): never write a row or byte limit, a preview size, a batch size, an undo window or
  a legacy encoding name in source. They are options the caller reads from settings or the market pack.
- Readers stream: never collect a whole file. Decoding is strict (`fatal: true`).
- A refused row is reported (`RowError`), never fatal. A batch that throws fails the run; the run resumes after its
  cursor.
- Only add a symbol a consumer imports today (OS data-exchange, a product importer, the registry row).

## Rules that fail the build

- A package never imports an app, a service, `encore.dev`/`~encore/*`, or another package's `src/`.
- Versions are `catalog:<name>` or `workspace:*` only. Imports leaving a folder use the `#core/*` or `#contracts/*`
  alias; `contracts` imports nothing from `core`.
- No `enum`, no `#private` fields, no parameter properties.
- Coverage meets the shared gate (lines/functions 80, branches 70).

## Tasks

`pnpm turbo run <task> --filter=@stackra/data-transfer` — `build`, `typecheck`, `lint`, `test`, `test:coverage`,
`format`, `format:check`, `clean`.

## PII

| Data          | Where                                 | Handling                                                                                                                                   |
| ------------- | ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| Imported rows | readers, `ImportRunner`               | Streamed to the target; never logged, never kept here.                                                                                     |
| Row errors    | `RowError`                            | Sheet, row number, field path, code and the schema's message; never the row's cells.                                                       |
| Before-images | `ImportChange.before`, `ImportLedger` | The target's record before the import; the durable driver keeps it under the record's data class and drops it when the undo window closes. |
| Exports       | writers                               | Whatever rows the caller passes; filtering by permission is the caller's.                                                                  |
| Pay inputs    | `PayInput`, `payrollSheet`            | An employee's pay; streamed to the writer, never logged.                                                                                   |
