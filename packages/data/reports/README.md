# @stackra/reports

<!--
Stackra file contract:
Purpose: the package's reader guide: the `Report` kind, its closed vocabulary, what gen does with a report, the
         `ReportRunner` port and what is not here yet.
Boundary: documentation only; the code and ADR 0470 win on any difference.
Runtime: none
Governing contract: ADR 0470 (Reports v2); ADR 0294 (kinds by base class); ADR 0154 (no tenant code or SQL).
-->

A module ships its reports as code: a `Report<Source>({...})` class names the dimensions a report may be grouped,
filtered and pivoted by and the measures it may compute. Nothing outside the declaration can be asked for, so a saved
report or an agent's question is data over declared names, never SQL (ADR 0470, ADR 0154).

**Tier:** `tier:lib` (`packages/data/reports`), category data, entries `.` (isomorphic) and `./node` (the Postgres
report compiler). Depends on `@stackra/container` and `@stackra/contracts`; `./node` adds `@stackra/actions`,
`@stackra/config`, `@stackra/database`, `@stackra/errors`, `@stackra/validation` and `zod`.

## Declaring a report

```ts
// src/modules/orders/reports/order-sales.report.ts
export class OrderSalesReport extends Report<Order>({
  key: "order_sales",
  dimensions: {
    placedAt: { path: "placedAt", grains: [TimeGrain.Day, TimeGrain.Month] },
    status: { path: "status" },
    country: { path: "customer.country" }, // follows a relation or Link<T>
  },
  measures: {
    orders: { kind: MeasureKind.Count, metric: ReportMetric.Count },
    revenue: { kind: MeasureKind.Sum, field: "total", metric: ReportMetric.Money },
    buyers: { kind: MeasureKind.CountDistinct, field: "customerId", metric: ReportMetric.Count },
    perBuyer: {
      kind: MeasureKind.Formula,
      formula: "orders / buyers",
      metric: ReportMetric.Number,
    },
  },
  defaultFilter: { status: "paid" },
  permission: OrderPermissions.report,
}) {}
```

The source is a model or a projection row (the type argument; gen reads it). `Report` refuses, when the class is
declared: a key that is not snake_case, an empty section, a name that is not camelCase or is used twice, a path that is
not camelCase segments, an unknown or repeated grain, a measure kind or metric outside the enums, a field on `count` or
`formula` or none on the others, money on anything but sum, avg, min or max, and a formula outside the grammar
(`+ - * /`, parentheses, numbers and measure names) or naming an undeclared measure or a cycle.

## What is here

| Symbol                                                                                                | Use                                                                   |
| ----------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| `Report`                                                                                              | the kind base (called only, with the source as the type argument)     |
| `ReportBase` (type)                                                                                   | the instance side: `reportKey`, `declaration`                         |
| `TimeGrain`, `MeasureKind`, `ReportMetric`                                                            | the closed vocabulary of ADR 0470 decision 2                          |
| `formulaNames`                                                                                        | the formula grammar check; returns the measure names a formula reads  |
| `ReportRunner`                                                                                        | the port each generated report query injects (`reports.ReportRunner`) |
| `ReportRequest`, `ReportResult`                                                                       | the generated query's input and output                                |
| `ReportOptions`, `ReportDeclaration`, `ReportDimension`, `ReportMeasure`, `ReportPath`, `ReportClass` | the option and declaration types                                      |

## What gen does with a report

`@stackra/gen` reads `Report` as the `report` kind (file `reports/<name>.report.ts`, class `<Name>Report`). It records
each one in `stackra.manifest.json` under `reports` (key `<module>.<key>`, source, dimensions, measures, default
filter, permission, query key), refuses a dimension or measure path the source model does not have
(`report_dimension_unknown`, `report_measure_unknown`) and a misplaced file (`report_misplaced`), and writes one query
class per report into `#stackra/reports` (`.stackra/gen/reports.ts`), keyed `report.<key>`, whose `handle` calls the
`ReportRunner`.

## Running a report (`@stackra/reports/node`)

`PostgresReportRunnerDriver` is the report compiler, the `postgres` driver of `ReportRunner` (ADR 0470 decision 3).
One run is one parameterised statement built through the ORM query builder:

- **Checked request.** Every dimension, grain, measure, filter, sort key (at most three, requested names only) and
  pivot axis must be declared; anything else is `ReportRequestInvalidError` (`report_request_invalid`). Filter values
  use the table filter vocabulary (`{ op: "range" }`, `dateRange` with `from`/`to`, `contains`, `isNull`, `gt`...);
  others are `TableFilterInvalidError`. A named date range is refused for now.
- **Paths through metadata.** Each path resolves to a column of the generated metadata; a to-one relation path
  (`customer.country`) is left-joined once; a to-many relation is refused (it would repeat rows).
- **Server grouping.** Time grains bucket with `date_trunc(grain, column, timeZone)` in the call's time zone (UTC
  outside a call). `grouping sets ((dimensions), ())` returns the groups and the grand totals in the same statement, and
  a `row_number()` rank in the requested sort pages them; formulas compile to SQL with `nullif` on every divisor.
- **Visibility.** The source's visible keys (`visibleKeysQuery`, the same conditions `CrudService` reads apply) narrow
  the rows; row-level security holds because the run uses the caller's transaction settings, which `onReplica` replays.
- **Mixed-currency guard.** A money measure (and any money a formula reads) is checked per group and for the total;
  two currencies refuse the run with `MixedCurrencyError`. Money comes back as `{ minor, currency }`.
- **Replica, timeout, row cap.** `ReportsConfig` (`pageSize` 100, `maxRows` 10000, `timeout` 30 s, `replica` true):
  runs go to the read replica, inside a transaction with the statement timeout; a page and the cursor stop at
  `maxRows`. The cursor is an opaque offset (a sort may be on a measure, so there is no key to seek from).

Generated wiring binds the driver (`deps: [Database, ContextStorage, ReportsConfig]`) and calls
`registerReportSources([[OrderSalesReport, Order]])`, since the source type argument is gone at run time.

| `./node` symbol                                     | Use                                                    |
| --------------------------------------------------- | ------------------------------------------------------ |
| `PostgresReportRunnerDriver`                        | the report compiler (`ReportRunner` driver `postgres`) |
| `ReportsConfig`, `ReportsOptions`, `ReportsConfig$` | page size, row cap, timeout, replica                   |
| `registerReportSources`                             | report class to source model, from generated wiring    |
| `ReportRequestInvalidError`                         | `report_request_invalid`                               |

## Not here yet

- Subtotals per level and the pivot matrix (stackra-391): pivot axes are checked, not laid out; column visibility
  (stackra-395); saved `ReportDefinition` rows (stackra-396); the `ReportEngine` port (stackra-398).
- A projection-row source (the runner reads registered models only) and a `Link<T>` path that is not an ORM relation.
- Named date ranges in report filters (the run carries no period).
- With no replica connected, the statement timeout is `set local` inside the caller's transaction and lasts until it
  ends.
- Registering the generated queries as actions (endpoint, MCP tool), the driver binding and the
  `registerReportSources` call in the generated wiring.
