---
"@stackra/data-transfer": minor
---

Import several sheets of one workbook into several targets in one run (`ImportRunner.runSheets`), resumed per sheet and
reverted per sheet's target, with mapping profiles from seed packs (`IMPORT_MAPPING_PROFILE_SCHEMA`, `sheetImportsOf`).
Add the JSON Lines reader and writer, the durable `ImportLedger` contract with `purge` of before-images at the end of
the undo window, and payroll pay-input exports from per-provider profiles (`payrollSheet`, `DatevAsciiWriterDriver`,
seeded generic CSV, DATEV LODAS and ZenHR XLSX profiles). Breaking: the XLSX drivers move to the new `./node` entry
(STA-711, STA-714, ADR 0431).
