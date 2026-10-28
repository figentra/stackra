---
"@stackra/panel": minor
"@stackra/documents": minor
---

Queued resource export (STA-1490, reporting gap 11, ADR 0307 rule 10). `@stackra/panel/node` adds `ExportRunner`: it
pages a resource's list query as the reader (per-row permissions), drops `@Classified` columns unless opted in under an
L2 permission, streams at most `maxRows` rows into CSV, XLSX, JSON Lines or PDF on the host disk, and returns a 24-hour
signed link whose issue is access-logged. Adds `ExportInput`, `ExportOutput`, `ExportSource`, `ExportConfig`
(`ExportOptions`, `ExportConfig$`), and `ExportFormat.JsonLines` and `ExportFormat.Pdf`. `@stackra/documents` adds
`PdfTableWriterDriver`, the `pdf` driver of data-transfer's `TabularWriter`. New dependencies: panel on
`@stackra/access-log`, `@stackra/config`, `@stackra/data-transfer`, `@stackra/documents`, `@stackra/filesystem`;
documents on `@stackra/data-transfer`.
