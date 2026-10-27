<!-- Purpose: the reader guide of @stackra/data-transfer: what is exported, an import and its dry run, an export, payroll exports, the zip writer. Boundary: docs of packages/data/data-transfer only. Runtime: none (Markdown). Governing contract: ADR 0367; ADR 0431; ADR 0163; STA-918. -->

# @stackra/data-transfer

Tabular import and export for every product (ADR 0367 and ADR 0431, implementing ADR 0163 decisions 3 and 4):
streaming CSV, JSON Lines and XLSX readers and writers, encoding detection with a market-pack fallback, Arabic header
normalisation, column mapping and mapping profiles, a preview, per-row errors, resumable single- and multi-sheet
imports recorded in a ledger with a whole-run revert and a before-image purge, payroll pay-input exports (CSV,
XLSX, DATEV ASCII) from per-provider profiles, and a streaming zip writer (deflate, ZIP64).

**Tier:** `tier:lib` (`packages/data/data-transfer`). Entries `.`, `./contracts` and `./node` (XLSX only, so a browser
never loads exceljs). Depends on `@stackra/container`,
`@stackra/contracts`, `@stackra/errors`, `exceljs` and `zod`.

Mechanism only (ADR 0363): row and byte limits, the preview size, the batch size, the undo window and the legacy
encoding of a market are inputs the caller reads from settings and market packs. The package has no default for any.

## What is here

| Entry         | Symbol                                                                                  | Use                                                                                             |
| ------------- | --------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| `./contracts` | `TabularReader`, `TabularWriter`, `ImportLedger`                                        | the ports                                                                                       |
| `./contracts` | `ImportRunState`                                                                        | `running`, `failed`, `finished`, `reverted`                                                     |
| `./contracts` | `ImportTarget`, `ImportChange`, `ImportBatchEntry`, `RowError`, `TabularRow` and others | the types the ports name                                                                        |
| `./contracts` | `ImportChange$`, `RowError$`                                                            | their shipped schemas, for a shape field typed with them                                        |
| `.`           | `CsvReaderDriver`, `JsonLinesReaderDriver`                                              | read rows                                                                                       |
| `.`           | `CsvWriterDriver`, `JsonLinesWriterDriver`, `DatevAsciiWriterDriver`                    | write bytes                                                                                     |
| `./node`      | `XlsxReaderDriver`, `XlsxWriterDriver`                                                  | XLSX: every sheet or the chosen ones; several sheets                                            |
| `.`           | `MemoryImportLedgerDriver`                                                              | the in-memory ledger (keeps the durable driver contract)                                        |
| `.`           | `MemoryTabularReaderDriver`, `MemoryTabularWriterDriver`                                | `memory` tests and dev: rows from held sheets; writes kept                                      |
| `.`           | `ImportRunner`                                                                          | `run`, `runSheets` (several sheets, several targets), `revert`; `dryRun` checks without writing |
| `.`           | `IMPORT_MAPPING_PROFILE_SCHEMA`, `sheetImportsOf`                                       | a seed-pack mapping profile to `runSheets` sheets                                               |
| `.`           | `PAYROLL_EXPORT_PROFILE_SCHEMA`, `payrollSheet`, `datevWriteOptionsOf`                  | pay inputs to a provider's file                                                                 |
| `.`           | `previewTabular`, `matchColumns`, `compileMapping`, `normalizeHeader`, `detectEncoding` | the mapping screen's helpers                                                                    |
| `.`           | `writeZip`, `ZipEntry`                                                                  | a streamed zip of many files: deflate or store, ZIP64                                           |
| `.`           | `TransferLimitExceededError`, `UnreadableEncodingError`                                 | a file past a limit; a file whose text cannot be read (400)                                     |
| `.`           | `ImportRunClosedError`, `ImportRunNotFoundError`, `ImportUndoExpiredError`              | a closed run (409); an unknown run (404); past the window (412)                                 |

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

### A dry run

`dryRun: true` on `run` or `runSheets` maps and validates every row exactly as a real run does, but calls no
target `upsert` and records nothing in the `ImportLedger`: no run, no batch, no cursor. The report has `written: 0`,
`dryRun: true`, `valid` (the rows that would be written) and every refused row in `errors`. A real run under the same
id afterwards starts from the first row.

```ts
const check = await runner.run({ ...options, rows: reader.read(upload(), read), dryRun: true });
// { runId, written: 0, dryRun: true, valid: 1180, errors: [{ sheet, row, issues }] }
```

A CSV file's encoding is its byte order mark, else UTF-8 when its bytes are valid UTF-8, else `fallbackEncoding`.
Decoding is strict, so a wrong encoding is an `UnreadableEncodingError`, never garbled text. Headers match after
`normalizeHeader` (diacritics, tatweel, hamza forms, alef maqsura, Arabic-Indic digits, invisible marks, spacing, case).

## An export

```ts
import { XlsxWriterDriver } from "@stackra/data-transfer/node";

const bytes = new XlsxWriterDriver().write([
  { name: "Orders", rows: orderRows() },
  { name: "Lines", rows: lineRows() },
]);
```

## A zip

```ts
import { JsonLinesWriterDriver, writeZip } from "@stackra/data-transfer";

const bytes = writeZip(
  [
    { name: "manifest.json", bytes: [manifestBytes] },
    {
      name: "models/orders.jsonl",
      bytes: new JsonLinesWriterDriver().write([{ name: "orders", rows }]),
    },
    { name: "files/logo.png", bytes: logo, method: "store" }, // already compressed
  ],
  clock.now(),
);
await disk.write(path, bytes, { contentType: "application/zip" });
```

Entries are deflated as their chunks arrive (`CompressionStream("deflate-raw")`) and stored with `method: "store"`.
Sizes go in a data descriptor after each entry, so nothing is buffered but one central record per entry. Past 4 GiB or
65,535 entries the archive carries ZIP64 records. Names are UTF-8; signing the bytes is the caller's.

The CSV writer writes a UTF-8 BOM and prefixes text cells that a spreadsheet would run as formulas with `'`; both are
options (`byteOrderMark`, `formulaGuard`).

## A workbook import

```ts
const profile = IMPORT_MAPPING_PROFILE_SCHEMA.parse(seedRow.value); // products, then variants
await runner.runSheets({
  runId: job.id,
  rows: new XlsxReaderDriver().read(upload(), read),
  sheets: sheetImportsOf(profile, { products: productTarget, variants: variantTarget }),
  batchSize: settings.importBatchSize,
});
await runner.revert(job.id, { Products: productTarget, Variants: variantTarget }, { window });
await ledger.purge(new Date(now - window), now); // on a schedule: drop before-images after the undo window
```

## A payroll export

```ts
const profile = PAYROLL_EXPORT_PROFILE_SCHEMA.parse(tenantProfile); // seeded from assets/data/payroll-export-profiles
const sheet = payrollSheet(profile, payInputs);
const bytes =
  profile.format === "datev-ascii"
    ? new DatevAsciiWriterDriver().write([sheet], datevWriteOptionsOf(profile, tenantDatevNumbers))
    : profile.format === "xlsx"
      ? new XlsxWriterDriver().write([sheet])
      : new CsvWriterDriver().write([sheet], { delimiter: profile.delimiter });
```

An input whose pay item has no code in the profile is refused, so no pay is dropped.

## Not here

- Platform importers (Shopify, Magento, Salla, Zid), AI mapping, mapping-profile storage: OS data-exchange.
- The durable ledger driver and its table (it keeps the `ImportLedger` contract, ADR 0431 decision 3), scheduled
  exports, signed links, permission filtering of rows, the full tenant export: OS data-exchange.
- Plain JSON (one array): not streamable, so it stays on the full-tenant export path (ADR 0431 decision 2).
- Payroll connectors (ZenHR, Kombo, Gusto): `@stackra/integrations`.
