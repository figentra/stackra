---
"@stackra/data-transfer": patch
---

The XLSX reader and writer no longer depend on exceljs, whose last release pulls uuid 8 and glob and minimatch copies
with open advisories (STA-1736). The writer streams the OOXML parts through the package's `writeZip`; the reader
reads the archive's central directory with `node:zlib` and parses the workbook, shared strings, styles and sheets
itself. Rows, sheet names, text cells and ISO 8601 dates are as before. The reader now holds the file in memory,
capped by `limits.bytes`.
