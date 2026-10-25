# @stackra/data-transfer

Tabular import and export for every product (ADR 0367, implementing ADR 0163 decisions 3 and 4): streaming CSV and
XLSX readers and writers, encoding detection with a market-pack fallback, Arabic header normalisation, column mapping,
a preview, per-row errors, and resumable import batches recorded in a ledger with a whole-run revert.

**Tier:** `tier:lib` (`packages/data/data-transfer`). Entries `.` and `./contracts`. Depends on `@stackra/container`,
`@stackra/contracts`, `@stackra/errors`, `exceljs` and `zod`.

Mechanism only (ADR 0363): row and byte limits, the preview size, the batch size, the undo window and the legacy
encoding of a market are inputs the caller reads from settings and market packs. The package has no default for any.

## What is here

| Entry         | Symbol                                                                                  | Use                                                             |
| ------------- | --------------------------------------------------------------------------------------- | --------------------------------------------------------------- |
| `./contracts` | `TabularReader`, `TabularWriter`, `ImportLedger`                                        | the ports                                                       |
| `./contracts` | `ImportRunState`                                                                        | `running`, `failed`, `finished`, `reverted`                     |
| `./contracts` | `ImportTarget`, `ImportChange`, `ImportBatchEntry`, `RowError`, `TabularRow` and others | the types the ports name                                        |
| `.`           | `CsvReaderDriver`, `XlsxReaderDriver`                                                   | read rows; XLSX streams every sheet or the chosen ones          |
| `.`           | `CsvWriterDriver`, `XlsxWriterDriver`                                                   | write bytes; XLSX writes several sheets                         |
| `.`           | `MemoryImportLedgerDriver`                                                              | the in-memory ledger                                            |
| `.`           | `ImportRunner`                                                                          | `run` (batches, per-row errors, resume) and `revert` (undo)     |
| `.`           | `previewTabular`, `matchColumns`, `compileMapping`, `normalizeHeader`, `detectEncoding` | the mapping screen's helpers                                    |
| `.`           | `TransferLimitExceededError`, `UnreadableEncodingError`                                 | a file past a limit; a file whose text cannot be read (400)     |
| `.`           | `ImportRunClosedError`, `ImportRunNotFoundError`, `ImportUndoExpiredError`              | a closed run (409); an unknown run (404); past the window (412) |

## An import

```ts
import {
  CsvReaderDriver,
  ImportRunner,
  matchColumns,
  previewTabular,
} from "@stackra/data-transfer";

const read = {
  fallbackEncoding: pack.legacyEncoding,
  limits: { rows: settings.importRows, bytes: settings.importBytes },
};
const preview = await previewTabular(reader, upload(), { ...read, rows: settings.previewRows });
const mapping = saved ?? matchColumns(preview.sheets[0].header, productFields); // then the user (or the AI step) fills gaps

const report = await runner.run({
  runId: job.id, // the same id resumes after a failure
  rows: reader.read(upload(), read),
  mapping,
  target: productImportTarget, // schema, upsert by key in one unit of work, revert from before-images
  batchSize: settings.importBatchSize,
});
// report.errors: [{ sheet, row, issues: [{ field, code, message }] }]

await runner.revert(job.id, productImportTarget, { window: settings.importUndoWindow });
```

A CSV file's encoding is its byte order mark, else UTF-8 when its bytes are valid UTF-8, else `fallbackEncoding`.
Decoding is strict, so a wrong encoding is an `UnreadableEncodingError`, never garbled text. Headers match after
`normalizeHeader` (diacritics, tatweel, hamza forms, alef maqsura, Arabic-Indic digits, invisible marks, spacing, case).

## An export

```ts
const bytes = new XlsxWriterDriver().write([
  { name: "Orders", rows: orderRows() },
  { name: "Lines", rows: lineRows() },
]);
```

The CSV writer writes a UTF-8 BOM and prefixes text cells that a spreadsheet would run as formulas with `'`; both are
options (`byteOrderMark`, `formulaGuard`).

## Not here

- Platform importers (Shopify, Magento, Salla, Zid), AI mapping, mapping-profile storage: OS data-exchange.
- The durable ledger driver and its table, scheduled exports, signed links, permission filtering of rows, the full
  tenant export: OS data-exchange (ADR 0367 decisions 1 and 9).
- JSON and JSONL formats and multi-sheet imports: ADR 0367 open questions.
