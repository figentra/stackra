---
"@stackra/privacy": minor
---

New package `@stackra/privacy` (STA-1375): the `PersonalData` kind a module declares its personal data with (model,
subject property, and each field's `ErasureMethod`: `shred`, `delete` or `anonymise`); the DSAR export job
`ExportSubjectDataAction` with `SubjectExportService`, which writes a zip behind a signed link for
`PrivacyConfig.exportTtlDays` (7) and `PurgeSubjectExportsAction` that deletes older zips; and the erasure saga
`EraseSubjectWorkflow` (started by `EraseSubjectAction`) that honours `HoldRegistry` legal holds, crypto-shreds the
subject key through the new `SubjectSaltStore` port, deletes or anonymises the rest through `PersonalDataStore`, and
issues the receipt as `SubjectErased` plus an optional `ServiceAcked`. Targets PDPL and GDPR.
