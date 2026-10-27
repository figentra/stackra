---
"@stackra/data-transfer": minor
---

`ImportRunner.run` and `runSheets` take `dryRun: true`: every row is mapped and validated as in a real run, but no
target `upsert` is called and nothing is recorded in the `ImportLedger`. The report then has `written: 0`,
`dryRun: true`, `valid` (rows that would be written) and every refused row (STA-918).
