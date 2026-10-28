---
"@stackra/reports": minor
---

Add `@stackra/reports/node`: `PostgresReportRunnerDriver`, the report compiler behind `ReportRunner`. A request is
checked against the report's declaration and compiled into one parameterised statement through the ORM query builder,
with grouping sets for the grand totals, time grains in the call's time zone, formulas with guarded division, the
source's visible keys, the mixed-currency guard, the read replica by default, a statement timeout and a row cap
(`ReportsConfig`). `registerReportSources` maps a report class to its source model for generated wiring.
