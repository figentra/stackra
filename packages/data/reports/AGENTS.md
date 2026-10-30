# AGENTS — @stackra/reports

Module reports: the `Report<Source>({ key, dimensions, measures, defaultFilter, permission })` kind base, its closed
vocabulary, the `ReportRunner` port, the `ReportEngine` port (ADR 0470) and the `ProductAnalytics`
port for funnels, retention and cohorts (ADR 0163 decision 5 as amended 2026-10-28), and the `Forecaster` port for
series forecasts (ADR 0492 decision 8). Member at `packages/data/reports` (`tier:lib`), in the programming
model v3.1 shape (ADR 0294, 0305). Entries `.`, `./contracts` (the `ReportEngine` port, stackra-398) and `./node` (the engine runner and the Postgres
report engine, stackra-390 and stackra-398).

## Where code goes

| You are writing… | It goes in…                                 |
| ---------------- | ------------------------------------------- |
| The kind base    | `src/core/bases/report.base.ts`             |
| An enum          | `src/core/enums/<name>.enum.ts`             |
| A pure function  | `src/core/functions/<name>.function.ts`     |
| A core port      | `src/core/ports/<name>.port.ts`             |
| An engine type   | `src/contracts/{ports,types}`               |
| A type           | `src/core/types/<name>.type.ts`             |
| The compiler     | `src/node/drivers`, `src/node/functions`    |
| Its config       | `src/node/{config,constants,schemas}`       |
| A test           | `__tests__/<name>.<kind>.test.ts` beside it |

## Entries and barrels

- `src/core/index.ts` is a stand-in barrel until gen writes the entry barrels (STA-339); add every new public file to
  it and to the export list in `src/core/__tests__/index.test.ts`.
- `ReportBase` is exported as a type only.
- `src/node/index.ts` is the `./node` stand-in barrel; keep `src/node/__tests__/index.test.ts` in step.
- `src/contracts/index.ts` is the `./contracts` leaf entry: it imports no other entry of this package, and its types
  stay engine-neutral strings so an engine package needs nothing else; keep `src/contracts/__tests__/index.test.ts` in
  step (it also checks the core types stay assignable).
- A new engine driver adds its name to `REPORT_ENGINES` (`src/node/constants`) in the same commit as the driver; a new
  product analytics driver adds its name to `PRODUCT_ANALYTICS_DRIVERS`.
- A `ProductAnalytics` driver runs the shared checks (`check-product-analytics-query.function.ts`) before it reaches its
  store, sends caller values only as structured query values (never HogQL or SQL text), isolates the call's scope
  itself and refuses a call with none, and returns counts of people only.
- A `Forecaster` driver runs `checkForecastQuery` first, never sends a series anywhere but the configured forecast
  service, and returns numbers and ids only. A new forecaster driver adds its name to `FORECASTER_DRIVERS` in the same
  commit as the driver; the bounds in `FORECAST_LIMITS` mirror the image's (`@stackra/infra-tools` `images/forecast`).
- A credential is a secret name in config read through `SecretStore` at call time; never a value, never in an error.

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
- Groups, subtotals, pivot margins and the grand total are grouping sets of one statement; a row's `"~grouping"` mask
  (`groupingMask`) says which. Never total or pivot in JavaScript over a page; `pageSql` keeps every caller value bound.
- Column visibility is decided once, by `hiddenReportColumns` (iam's `hiddenColumns`), and applied before the engine
  runs; never let an engine see a hidden column, and never reveal a hidden value through a formula, filter or sort.
- `MeasureKind` takes its aggregate codes from `@stackra/database`'s `Aggregate` (the only aggregate enum); never
  declare another.

## Rules that fail the build

- A package never imports an app, a service, `encore.dev`/`~encore/*`, or another package's `src/`.
- Versions are `catalog:<name>` or `workspace:*` only. Imports leaving a folder use the `#core/*` alias.
- No `enum`, no `#private` fields, no parameter properties.
- Coverage meets the shared gate (lines/functions 80, branches 70).

## Tasks

`pnpm turbo run <task> --filter=@stackra/reports` — `build`, `typecheck`, `lint`, `test`, `test:coverage`, `format`,
`format:check`, `clean`.

## PII

| Data              | Where                                             | Handling                                                                                                                     |
| ----------------- | ------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| Report rows       | `ReportResult`                                    | Grouped values of declared dimensions and measures only; columns the caller may not see are dropped (`hiddenReportColumns`). |
| Product analytics | `FunnelResult`, `RetentionResult`, `CohortResult` | Counts of people only; no person id or property value is returned.                                                           |
