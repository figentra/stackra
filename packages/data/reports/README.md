# @stackra/reports

<!--
Stackra file contract:
Purpose: the package's reader guide: the `Report` kind, its closed vocabulary, what gen does with a report, the
         `ReportRunner`, `ReportEngine` and `ProductAnalytics` ports and what is not here yet.
Boundary: documentation only; the code and ADR 0470 win on any difference.
Runtime: none
Governing contract: ADR 0470 (Reports v2); ADR 0163 (decision 5 as amended 2026-10-28); ADR 0294 (kinds by base class); ADR 0154 (no tenant code or SQL).
-->

A module ships its reports as code: a `Report<Source>({...})` class names the dimensions a report may be grouped,
filtered and pivoted by and the measures it may compute. Nothing outside the declaration can be asked for, so a saved
report or an agent's question is data over declared names, never SQL (ADR 0470, ADR 0154).

**Tier:** `tier:lib` (`packages/data/reports`), category data, entries `.` (isomorphic), `./contracts` (the
`ReportEngine` port, isomorphic) and `./node` (the engine runner and the Postgres report engine). Depends on
`@stackra/container`, `@stackra/contracts`, `@stackra/database` (`Aggregate`, the measure codes) and `@stackra/iam`
(column visibility); `./node` adds `@stackra/actions`, `@stackra/config`, `@stackra/errors`, `@stackra/validation`
and `zod`.

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

## The engine port (`@stackra/reports/contracts`)

`ReportEngine` (`reports.ReportEngine`) is the store a report run executes on (ADR 0470 decision 8). It takes a
`ReportEngineQuery` (the report's declaration, its source model, the caller's request and the time zone) and returns a
`ReportEngineResult` (groups, grand totals, cursor). The types are engine-neutral strings, so an engine package (the Pro
`clickhouse` and `duckdb` engines, stackra-417) imports only this entry; the core `ReportDeclaration`, `ReportRequest`
and `ReportResult` are assignable to them. Which engine runs is `ReportsConfig.engine` (`postgres`), never code. An
engine applies record visibility and scope isolation itself and never widens what the caller may read.

| `./contracts` symbol                                                      | Use                                     |
| ------------------------------------------------------------------------- | --------------------------------------- |
| `ReportEngine`                                                            | the port an engine driver extends       |
| `ReportEngineQuery`, `ReportEngineRequest`, `ReportEngineResult`          | one run, the caller's ask, its answer   |
| `ReportEngineDeclaration`, `ReportEngineDimension`, `ReportEngineMeasure` | the report's declaration as engines see |

## Funnels, retention and cohorts (`ProductAnalytics`)

`ProductAnalytics` (`reports.ProductAnalytics`, in `./contracts`) computes product analytics over the events the
analytics client sends (ADR 0163 decision 5 as amended 2026-10-28): `funnel` (two to twenty ordered steps within a
window of days), `retention` (cohorts by start event, people returning per day, week or month) and `cohort` (distinct
people matching an event per period). Results are counts of people, never who they are. Which store answers is
`ReportsConfig.productAnalytics`.

```ts
const funnel = await analytics.funnel({
  steps: [{ event: "cart_viewed", where: { channel: ["web", "app"] } }, { event: "order_placed" }],
  range: { from: "2026-10-01", to: "2026-10-28" },
  windowDays: 7,
});
// { steps: [{ event: "cart_viewed", people: 120, conversion: 1, medianSeconds: null }, { ..., conversion: 0.35 }] }
```

`PosthogProductAnalyticsDriver` (`posthog`, `./node`) posts each query as a structured node (`FunnelsQuery`,
`RetentionQuery`, a `TrendsQuery` of distinct people) to `<host>/api/projects/<projectId>/query/`; no caller value is
ever query text. Settings are `reports.posthog` (`host`, `projectId`, `keySecret`, `scopeProperty`): the personal API
key is read from the runtime `SecretStore` under `keySecret` at call time. **Scope isolation:** every query is ANDed with
an exact filter on the event property `scopeProperty` (`scope_id`) equal to the call's `scopeId`; a call with no scope is
refused (`ProductAnalyticsScopeMissingError`), unless `scopeProperty` is `null` for a project holding one scope's events
(Stackra's own product analytics, ADR 0190 decision 2). The events must therefore carry that property. Buckets fall in
the PostHog project's time zone. A malformed query is `ProductAnalyticsQueryInvalidError` and never reaches PostHog; an
unconfigured project, unbound key, error status or unreadable reply is `ProductAnalyticsUnavailableError` (retryable,
never carrying the key or the reply body).

| Symbol                                                                             | Use                                                |
| ---------------------------------------------------------------------------------- | -------------------------------------------------- |
| `ProductAnalytics`, `RetentionPeriod` (`./contracts`)                              | the port and its period enum                       |
| `FunnelQuery`, `RetentionQuery`, `CohortQuery` and their results                   | the queries and the counts they return             |
| `AnalyticsEventMatch`, `AnalyticsDateRange`, `AnalyticsPropertyValue`              | an event with property values; a day range         |
| `PosthogProductAnalyticsDriver` (`./node`)                                         | the `posthog` driver                               |
| `ProductAnalyticsQueryInvalidError`, `...ScopeMissingError`, `...UnavailableError` | `validation`, `failed precondition`, `unavailable` |

## Forecasts (`Forecaster`)

`Forecaster` (`reports.Forecaster`, in `./contracts`) forecasts batches of series, such as demand per item and location
(ADR 0492 decision 8). `forecast({ series: [{ id, timestamps, values }], horizon, frequency: "H"|"D"|"W"|"M", models? })`
returns one `{ id, model, timestamps, mean, lo80, hi80 }` row per series and model: AutoETS and AutoARIMA by default,
`CrostonOptimized` for an intermittent series. Forecasts run as scheduled jobs in the owning service, which stores the rows
as records; the port stores nothing. Which driver runs is `ReportsConfig.forecaster`.

`HttpForecasterDriver` (`http`, `./node`) posts the query to `<reports.forecast.baseUrl>/forecast`, the `forecast` tool of
the regional tools stack (`@stackra/infra-tools`). The image sits in the private namespace and takes no token; when
`reports.forecast.tokenSecret` names a secret, its value is read from `SecretStore` at call time and sent as a bearer
token, never logged or put in an error. `MemoryForecasterDriver` (`memory`) carries the last value forward with a band,
for tests and local hosts. A malformed query (horizon outside 1 to 366, an unknown frequency or model, more than 5000
series, a duplicate id, fewer than three points, a non-finite value) is `ForecastQueryInvalidError` before any request;
an unconfigured service, unbound token, unreachable service, error status or misshapen reply is
`ForecastUnavailableError` (retryable).

| Symbol                                                      | Use                                    |
| ----------------------------------------------------------- | -------------------------------------- |
| `Forecaster` (`./contracts`)                                | the port                               |
| `ForecastQuery`, `ForecastSeries`, `ForecastRow`            | the batch asked and the rows answered  |
| `ForecastFrequency`, `ForecastModel`                        | the steps and models the image accepts |
| `HttpForecasterDriver`, `MemoryForecasterDriver` (`./node`) | the `http` and `memory` drivers        |
| `ForecastQueryInvalidError`, `ForecastUnavailableError`     | `validation`, `unavailable`            |

## Column visibility

A dimension or measure may carry a `permission` (a `Permissions` static) and a `dataClass` (a `DataClassification`
code or a product class key, ADR 0341):

A `credential` column is hidden even from the holder of its permission (ADR 0494).

```ts
measures: {
  margin: { kind: MeasureKind.Sum, field: "margin", metric: ReportMetric.Money, permission: OrderPermissions.margin },
},
dimensions: {
  email: { path: "customer.email", dataClass: DataClassification.Personal }, // hidden from everyone
  phone: { path: "customer.phone", dataClass: DataClassification.Personal, permission: OrderPermissions.contact },
},
```

`hiddenReportColumns(declaration, held)` names the columns a holder of the permission keys `held` may not see: a
permission column it does not hold, a classified column with no permission, and every formula over a hidden measure.
`EngineReportRunnerDriver` checks each column permission for the call's actor and scope through
`PolicyDecisionPointService` and drops what is hidden before the engine sees the request: hidden dimensions, measures,
sort keys and pivot axes go; a filter on a hidden dimension, or a request whose every measure is hidden, is
`ForbiddenError`. With no decision point bound, or outside a call, no permission is held (fail closed). The shared
definition validator (stackra-396) calls `hiddenReportColumns` with the audience's keys.

## Running a report (`@stackra/reports/node`)

`EngineReportRunnerDriver` is the `engine` driver of `ReportRunner`: it reads the report's declaration from its kind
record, finds the source model `registerReportSources` registered (on the class or an ancestor), takes the call's time
zone (UTC outside a call) and hands the run to the configured `ReportEngine`.

`PostgresReportEngineDriver` is the report compiler, the `postgres` driver of `ReportEngine` (ADR 0470 decisions 3 and
8). One run is one parameterised statement built through the ORM query builder:

- **Checked request.** Every dimension, grain, measure, filter, sort key (at most three, requested names only) and
  pivot axis must be declared; anything else is `ReportRequestInvalidError` (`report_request_invalid`). Filter values
  use the table filter vocabulary (`{ op: "range" }`, `dateRange` with `from`/`to`, `contains`, `isNull`, `gt`...);
  others are `TableFilterInvalidError`. A named date range is refused for now.
- **Paths through metadata.** Each path resolves to a column of the generated metadata; a to-one relation path
  (`customer.country`) is left-joined once; a to-many relation is refused (it would repeat rows).
- **Server grouping.** Time grains bucket with `date_trunc(grain, column, timeZone)` in the call's time zone (UTC
  outside a call). `grouping sets ((dimensions), ())` returns the groups and the grand totals in the same statement, and
  a `row_number()` rank in the requested sort pages them; formulas compile to SQL with `nullif` on every divisor.
- **Subtotals.** `subtotals: true` adds a grouping set per leading prefix of the dimensions (`(region, status)`,
  `(region)`): `ReportResult.subtotals` holds `{ level, values }` for the prefixes of the groups on this page only,
  deepest first, from the same statement.
- **Pivot.** `pivot: { rows, columns }` puts every requested dimension on exactly one axis and adds the row and column
  margins as grouping sets. `ReportResult.pivot` is `{ rows, columns, cells, rowTotals, columnTotals }` (keys are the
  axis values in order; an empty cell is `null`), and `totals` is the grand total. A pivot is not paged: it reads every
  cell up to `maxRows` and refuses beyond it, and it takes no cursor or `subtotals`.
- **Visibility.** The source's visible keys (`visibleKeysQuery`, the same conditions `CrudService` reads apply) narrow
  the rows; row-level security holds because the run uses the caller's transaction settings, which `onReplica` replays.
- **Mixed-currency guard.** A money measure (and any money a formula reads) is checked per group and for the total;
  two currencies refuse the run with `MixedCurrencyError`. Money comes back as `{ minor, currency }`.
- **Replica, timeout, row cap.** `ReportsConfig` (`pageSize` 100, `maxRows` 10000, `timeout` 30 s, `replica` true,
  `engine` `postgres`):
  runs go to the read replica, inside a transaction with the statement timeout; a page and the cursor stop at
  `maxRows`. The cursor is an opaque offset (a sort may be on a measure, so there is no key to seek from).

Generated wiring binds `ReportRunner` to `EngineReportRunnerDriver` (`deps: [ReportEngine, ContextStorage]`) and
`ReportEngine` to the driver `ReportsConfig.engine` names (`postgres`: `deps: [Database, ReportsConfig]`), and calls
`registerReportSources([[OrderSalesReport, Order]])`, since the source type argument is gone at run time.

| `./node` symbol                                     | Use                                                    |
| --------------------------------------------------- | ------------------------------------------------------ |
| `EngineReportRunnerDriver`                          | the `ReportRunner` driver `engine`                     |
| `PostgresReportEngineDriver`                        | the report compiler (`ReportEngine` driver `postgres`) |
| `ReportsConfig`, `ReportsOptions`, `ReportsConfig$` | page size, row cap, timeout, replica, engine           |
| `registerReportSources`                             | report class to source model, from generated wiring    |
| `ReportRequestInvalidError`                         | `report_request_invalid`                               |

## Not here yet

- Funnel, retention and cohort report kinds and widgets (stackra-418), a driver over Stackra's own event store
  (stackra-416), funnel breakdowns, property filters on retention events, cohorts of several criteria and saved
  cohorts; the analytics client does not yet put the scope id on events (`scope_id`), which the `posthog` driver
  filters by.
- Masking instead of dropping, column visibility in a report export and the shared-definition validator (both with
  stackra-396 and the report export); saved `ReportDefinition` rows (stackra-396); the Pro `clickhouse` and `duckdb` engines
  (stackra-417).
- A projection-row source (the runner reads registered models only) and a `Link<T>` path that is not an ORM relation.
- Named date ranges in report filters (the run carries no period).
- With no replica connected, the statement timeout is `set local` inside the caller's transaction and lasts until it
  ends.
- Registering the generated queries as actions (endpoint, MCP tool), the `ReportRunner` and `ReportEngine` driver
  bindings (`selectedBy: "config:reports.engine"`), the `ProductAnalytics` binding
  (`selectedBy: "config:reports.productAnalytics"`, `deps: [ReportsConfig, SecretStore, ContextStorage]`) and the `registerReportSources` call in the generated wiring.
