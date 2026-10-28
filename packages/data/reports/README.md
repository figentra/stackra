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

**Tier:** `tier:lib` (`packages/data/reports`), category data, entry `.` (isomorphic). Depends on `@stackra/container`
and `@stackra/contracts`.

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

## Not here yet

- The `ReportRunner` driver: `ReportCompiler` in `@stackra/reports/node` (stackra-390).
- Subtotals, grand totals per level and the pivot matrix (stackra-391); column visibility (stackra-395); saved
  `ReportDefinition` rows (stackra-396).
- Registering the generated queries as actions (endpoint, MCP tool) in the manifest's `actions` and the wiring.
