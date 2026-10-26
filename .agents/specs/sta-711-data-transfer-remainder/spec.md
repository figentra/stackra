# Feature Specification: data transfer remainder (multi-sheet imports, JSON Lines, durable ledger, XLSX in ./node)

**Feature Branch**: `figentra/sta-666-wave12`

**Created**: 2026-10-26

**Status**: Implementing <!-- owner mode: code and tests written, nothing run -->

**Linear**: STA-711

**Clarifications status**: complete (defaults recorded in ADR 0431, Proposed)

**Input**: One run feeding several targets from several sheets; JSON/JSONL reader and writer or a decision; a durable
`ImportLedger` contract with before-image purge; XLSX drivers in `./node`; the exceljs typings fix.

## Impact

- **Packages touched**: packages/data/data-transfer
- **Tenancy and data**: before-images purged at the end of the undo window (a setting); nothing logged
- **ADR needed**: yes, 0431 (Proposed)
- **New dependencies**: `yaml` (`catalog:`, dev only, for the seed data test); lockfile not updated (owner mode)
- **Lane**: full · **Change risk**: R2

## Requirements

- **FR-001** `ImportRunner.runSheets({ runId, rows, sheets, batchSize })`: sheets in dependency order, unnamed sheets
  read past, a batch never spans two sheets, per-sheet resume, out-of-order file refused; `run` keeps one sheet.
- **FR-002** `revert(runId, target | { sheet: target }, { window })`: newest batch first through its sheet's target;
  a missing target refuses before any revert; a purged run is past its window.
- **FR-003** `ImportLedger.purge(settledBefore, at)`; `ImportBatchEntry.sheet`; `ImportRunRecord.purgedAt`; the
  contract written on the port and kept by the memory driver.
- **FR-004** `JsonLinesReaderDriver` and `JsonLinesWriterDriver`; plain JSON stays on the full-tenant export path.
- **FR-005** `IMPORT_MAPPING_PROFILE_SCHEMA` and `sheetImportsOf(profile, targets)` load seed-pack mapping profiles.
- **FR-006** `XlsxReaderDriver` and `XlsxWriterDriver` in `./node`; exceljs loaded through `createRequire`.

## Not built here

- The durable ledger driver and its table: OS data-exchange. Product mapping profiles: each product's seed pack.
- Tests, typecheck and build are written but not run (owner mode).
