---
"@stackra/reports": minor
"@stackra/gen": minor
---

Add `@stackra/reports`: the `Report<Source>({ key, dimensions, measures, defaultFilter, permission })` kind base with
time-grained and relation-path dimensions and a closed set of measures (count, countDistinct, sum, avg, min, max and
formulas over other measures), the `ReportRunner` port and the `ReportRequest`/`ReportResult` contract. Gen reads the
`report` kind, records each report in the manifest's `reports` section (refusing unknown paths and misplaced files) and
writes one query class per report into `#stackra/reports`.
