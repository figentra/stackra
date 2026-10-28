---
"@stackra/reports": minor
---

Add `@stackra/reports/contracts` with the `ReportEngine` port (`reports.ReportEngine`) and its engine-neutral
declaration, request, query and result types, so the OLAP engine stays a configuration choice (`ReportsConfig.engine`,
`postgres` today). The report compiler is now `PostgresReportEngineDriver`, the `postgres` engine (replacing
`PostgresReportRunnerDriver`), and `EngineReportRunnerDriver` is the `ReportRunner` driver that resolves a report's
declaration, source model and time zone and hands the run to the selected engine.
