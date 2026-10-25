---
"@stackra/data-transfer": minor
---

Add `@stackra/data-transfer` (ADR 0367): the `TabularReader`, `TabularWriter` and `ImportLedger` ports in
`./contracts`; streaming CSV and multi-sheet XLSX readers and writers; strict decoding with BOM and UTF-8 detection and
a caller-given legacy fallback (for example a market pack's Windows-1256); Arabic header normalisation, `matchColumns`,
`compileMapping` and `previewTabular`; and `ImportRunner`, which validates each row against the target's schema,
reports refused rows, writes batches by key, records them in the ledger, resumes a failed run after its cursor and
reverts a whole run inside the caller's undo window. Limits, batch size, preview size and the undo window are inputs,
never defaults.
