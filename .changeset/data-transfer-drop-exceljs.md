---
"@stackra/data-transfer": patch
---

The XLSX reader and writer no longer depend on exceljs, whose last release pulls uuid 8 and glob and minimatch copies
with open advisories (STA-1736). The writer streams the OOXML parts through the package's `writeZip`; the reader
reads the archive's central directory with `node:zlib` and parses the workbook, shared strings, styles (1900 and 1904
dates) and sheets itself. Rows, sheet names, text cells and ISO 8601 dates are as before.

The reader treats every upload as untrusted: it refuses a zip bomb (entry count, compression ratio, part and total
inflated size), an absolute or climbing entry name, a DTD or entity declaration, XML nested too deep and a cell past
column XFD as the new `UnreadableWorkbookError` (`unreadable_workbook`, with a `reason`). `TransferLimits` gains
`columns` and `cellLength`, refused as `TransferLimitExceededError`. The file is held in memory, capped by
`limits.bytes`.
