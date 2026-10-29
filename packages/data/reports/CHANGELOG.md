# @stackra/reports

## 0.1.0

### Minor Changes

- 074d3e8: Report dimensions and measures take a `permission` and a `dataClass`. The report runner checks the caller's column
  permissions through the decision point and drops what it may not see (a classified column needs a permission; a formula
  over a hidden measure hides too); a filter on a hidden column is forbidden. `@stackra/iam` adds `hiddenColumns` and
  `ColumnRule`.
- 379af98: Add `@stackra/reports/node`: `PostgresReportRunnerDriver`, the report compiler behind `ReportRunner`. A request is
  checked against the report's declaration and compiled into one parameterised statement through the ORM query builder,
  with grouping sets for the grand totals, time grains in the call's time zone, formulas with guarded division, the
  source's visible keys, the mixed-currency guard, the read replica by default, a statement timeout and a row cap
  (`ReportsConfig`). `registerReportSources` maps a report class to its source model for generated wiring.
- a3fb768: Add `@stackra/reports/contracts` with the `ReportEngine` port (`reports.ReportEngine`) and its engine-neutral
  declaration, request, query and result types, so the OLAP engine stays a configuration choice (`ReportsConfig.engine`,
  `postgres` today). The report compiler is now `PostgresReportEngineDriver`, the `postgres` engine (replacing
  `PostgresReportRunnerDriver`), and `EngineReportRunnerDriver` is the `ReportRunner` driver that resolves a report's
  declaration, source model and time zone and hands the run to the selected engine.
- ae9621e: Reports return server subtotals per leading dimension (`subtotals: true`) and a pivot matrix with row and column
  totals (`pivot: { rows, columns }`), all from one grouping-sets statement. The panel's `Aggregate` is now
  `@stackra/database`'s (`average` becomes `avg`, `distinct` is added); `groupRows` is for fully loaded tables only.
- a32b62d: Add `@stackra/reports`: the `Report<Source>({ key, dimensions, measures, defaultFilter, permission })` kind base with
  time-grained and relation-path dimensions and a closed set of measures (count, countDistinct, sum, avg, min, max and
  formulas over other measures), the `ReportRunner` port and the `ReportRequest`/`ReportResult` contract. Gen reads the
  `report` kind, records each report in the manifest's `reports` section (refusing unknown paths and misplaced files) and
  writes one query class per report into `#stackra/reports`.
- 2d1d0ed: Add the `ProductAnalytics` port to `@stackra/reports/contracts` (funnels, retention tables and behavioural cohorts as
  counts of people, with `RetentionPeriod` and the query and result types) and its first driver,
  `PosthogProductAnalyticsDriver` in `./node`, which posts structured `FunnelsQuery`, `RetentionQuery` and `TrendsQuery`
  nodes to PostHog's query API with a key from the runtime secret store, narrowed to the call's scope. Configured by
  `ReportsConfig.productAnalytics` and `ReportsConfig.posthog`; refusals `ProductAnalyticsQueryInvalidError`,
  `ProductAnalyticsScopeMissingError` and `ProductAnalyticsUnavailableError`.

### Patch Changes

- 811e4b6: `vitest.config.ts` merges gen's `./.stackra/vitest.config` and `tsdown.config.ts` spreads gen's
  `./.stackra/tsdown.config` under the package's own entries, so gen keeps both (no `shim_authored`); package.json
  declares the `#stackra/*` import alias.
- Updated dependencies [f81699d]
- Updated dependencies [f7fb4ad]
- Updated dependencies [e7a388a]
- Updated dependencies [68dd2a5]
- Updated dependencies [e0f2fc8]
- Updated dependencies [2787c1e]
- Updated dependencies [df3f38b]
- Updated dependencies [4413118]
- Updated dependencies [a6ec591]
- Updated dependencies [38fb3e2]
- Updated dependencies [bc4acfc]
- Updated dependencies [ae3d280]
- Updated dependencies [2787c1e]
- Updated dependencies [a1fd4d6]
- Updated dependencies [99665bb]
- Updated dependencies [8ead1a8]
- Updated dependencies [e7a388a]
- Updated dependencies [e0f2fc8]
- Updated dependencies [1a7597c]
- Updated dependencies [2787c1e]
- Updated dependencies [ae3d280]
- Updated dependencies [703b40e]
- Updated dependencies [2787c1e]
- Updated dependencies [f7a2d36]
- Updated dependencies [a656add]
- Updated dependencies [94ae85f]
- Updated dependencies [dddbbcd]
- Updated dependencies [856995c]
- Updated dependencies [e7ee0a4]
- Updated dependencies [ca85d59]
- Updated dependencies [d72a734]
- Updated dependencies [9841d79]
- Updated dependencies [f6d1a76]
- Updated dependencies [c196bc6]
- Updated dependencies [49ab0e6]
- Updated dependencies [d156aa8]
- Updated dependencies [6d46e5e]
- Updated dependencies [2787c1e]
- Updated dependencies [38a5501]
- Updated dependencies [e0f2fc8]
- Updated dependencies [62c7ae1]
- Updated dependencies [c868bad]
- Updated dependencies [0d36f0d]
- Updated dependencies [a701ccb]
- Updated dependencies [a526605]
- Updated dependencies [da8bdbd]
- Updated dependencies [763e901]
- Updated dependencies [936fcb1]
- Updated dependencies [f11cbe8]
- Updated dependencies [f7a2d36]
- Updated dependencies [483eb44]
- Updated dependencies [2787c1e]
- Updated dependencies [26f40ad]
- Updated dependencies [20f3fe9]
- Updated dependencies [6f2c1f7]
- Updated dependencies [3d080e7]
- Updated dependencies [67aa168]
- Updated dependencies [82a533d]
- Updated dependencies [2787c1e]
- Updated dependencies [3312ef3]
- Updated dependencies [f0c9f64]
- Updated dependencies [038966e]
- Updated dependencies [0a7eaf1]
- Updated dependencies [abb1d69]
- Updated dependencies [a3d23d9]
- Updated dependencies [65f5ac1]
- Updated dependencies [396e384]
- Updated dependencies [d5e5ff8]
- Updated dependencies [b62c042]
- Updated dependencies [914465a]
- Updated dependencies [59ac846]
- Updated dependencies [a681685]
- Updated dependencies [187afe3]
- Updated dependencies [c34bf79]
- Updated dependencies [02ceb7e]
- Updated dependencies [8c7a376]
- Updated dependencies [2612a7e]
- Updated dependencies [0a20a9f]
- Updated dependencies [d5f5acf]
- Updated dependencies [0e7eb1f]
- Updated dependencies [3d0354e]
- Updated dependencies [3b19f6d]
- Updated dependencies [b163445]
- Updated dependencies [074d3e8]
- Updated dependencies [ae9621e]
- Updated dependencies [6745073]
- Updated dependencies [150fa18]
- Updated dependencies [150fa18]
- Updated dependencies [150fa18]
- Updated dependencies [37e1aa8]
- Updated dependencies [f746759]
- Updated dependencies [ca44233]
- Updated dependencies [a31d463]
- Updated dependencies [62a97c0]
- Updated dependencies [47554e7]
- Updated dependencies [2babf37]
- Updated dependencies [e756399]
- Updated dependencies [3e2fc84]
- Updated dependencies [5e8114b]
- Updated dependencies [2c0ea71]
- Updated dependencies [ab9cc36]
- Updated dependencies [8a1be69]
- Updated dependencies [a435dfd]
- Updated dependencies [fc44d7a]
- Updated dependencies [f7a2d36]
- Updated dependencies [2787c1e]
- Updated dependencies [d19a3d5]
  - @stackra/actions@0.1.0
  - @stackra/config@0.1.0
  - @stackra/container@0.1.0
  - @stackra/contracts@0.1.0
  - @stackra/database@0.1.0
  - @stackra/errors@0.1.0
  - @stackra/iam@0.1.0
  - @stackra/validation@0.1.0

Written by Changesets on release; never edited by hand.
