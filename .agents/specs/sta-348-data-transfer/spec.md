# Feature Specification: @stackra/data-transfer, streaming tabular files and resumable imports

**Feature Branch**: `figentra/sta-348-data-transfer`

**Created**: 2026-10-25

**Status**: Implementing <!-- Draft → Clarified → Planned → Ready → Implementing → Verified, or Abandoned / Superseded -->

<!-- Specs are public on GitHub: no secrets, customer data or details of an unfixed vulnerability (ADR 0120 D17). -->

**Linear**: STA-348

**Clarifications status**: complete (owner questionnaire 2026-10-25 #22; OS-162, OS-163, OS-164 answered `a`)

**Input**: the `@stackra/data-transfer` row of `notes/handover/stackra-package-needs.md`: "Streaming CSV and XLSX,
encoding detection (Windows-1256), Arabic headers, multi-sheet, preview, mapping, per-row errors, resumable batches
with rollback". Askers: OS data-exchange; Commerce (importers, bulk files, COM-302 to COM-309, COM-346); Juristra.

## Impact

- **Apps touched**: none. **Services touched**: none.
- **Packages touched**: `packages/data/data-transfer` (new).
- **Tenancy and data**: no table. The durable ledger driver and its table belong to the OS data-exchange service.
- **Secrets**: none.
- **ADR needed**: yes, ADR 0367 (Proposed).
- **New dependencies**: `exceljs` (catalog `exceljs`), for streaming XLSX read and write.
- **Configuration, not code (ADR 0363)**: limits, preview size, batch size, undo window and the legacy encoding are
  inputs; no value is in code.

## Acceptance criteria

1. **Streaming CSV.** Given a CSV file in chunks split anywhere, the reader yields each record as `{ sheet: "", row,
cells }` with RFC 4180 quoting, CRLF/LF/CR line ends and blank lines skipped, without holding the whole file.
2. **Streaming XLSX, multi-sheet.** Given a workbook with several sheets, the reader yields every sheet's rows with the
   sheet name and row number, cells as text (rich text, formula results, hyperlinks, dates as ISO 8601); `sheets`
   limits it to the chosen ones.
3. **Encoding detection.** A BOM wins; valid UTF-8 is UTF-8; otherwise the caller's fallback (a Windows-1256 file
   decodes to Arabic when the market pack passes it). Undecodable bytes or no fallback are `unreadable_encoding`.
4. **Arabic headers.** Headers match after normalisation (diacritics, tatweel, hamza forms, alef maqsura,
   Arabic-Indic digits, invisible marks, spacing, case).
5. **Limits.** Row and byte limits given by the caller refuse with `transfer_limit_exceeded`; none is defaulted.
6. **Preview.** `previewTabular` returns each sheet's header and its first N rows (N from the caller).
7. **Mapping.** `matchColumns` proposes field-to-header from field names and labels; `compileMapping` maps cells to a
   record, omitting empty cells and missing columns.
8. **Per-row errors.** A row failing the target schema is reported with sheet, row and each issue's field, code and
   message, and the run continues.
9. **Resumable batches with rollback.** Rows are written in batches of the caller's size through the target's upsert;
   each batch is recorded in the ledger with its last row; a failing batch fails the run and the next run with the same
   id resumes after the cursor without repeating committed rows.
10. **Undo.** `revert` reverts every batch newest first inside the caller's window; past it `import_undo_expired`; a
    running or reverted run `import_run_closed`; an unknown run `import_run_not_found`.
11. **Export.** CSV (BOM, CRLF, quoting, formula guard) and multi-sheet XLSX writers stream bytes.
12. Every public symbol has a unit test in `__tests__/` beside it.

## Plan

One `tier:lib` package with two entries. `./contracts`: the `TabularReader`, `TabularWriter` and `ImportLedger` ports,
`ImportRunState` and the types. `.`: CSV drivers written here (no dependency), XLSX drivers over the exceljs streaming
reader and writer, the memory ledger driver, the mapping and preview functions, `ImportRunner` and five refusals.

## Tasks

- [x] ADR 0367 (Proposed)
- [x] Member files (package.json, tsconfig, turbo.jsonc tier tag, stackra.config.ts, tsdown, vitest, README, AGENTS)
- [x] Contracts: ports, enum, types
- [x] CSV reader and writer; XLSX reader and writer; memory ledger
- [x] Encoding detection, header normalisation, mapping, preview
- [x] ImportRunner (run, resume, revert) and refusals
- [x] Unit tests for every public symbol (not run: owner mode)
- [x] Changeset
- [ ] Owner: add `exceljs` to a catalog in `pnpm-workspace.yaml`; run `pnpm install` and `pnpm verify`
- [ ] OS data-exchange: durable ledger driver, settings keys, mapping-profile storage

## Not in scope

Platform importers, AI mapping, scheduled exports and signed links, permission filtering of export rows, the full
tenant export (OS-165), JSON and JSONL, multi-sheet imports.
