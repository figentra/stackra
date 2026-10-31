# Bug Specification: consumers resolve no advisory through data-transfer, app or navigation

**Feature Branch**: `figentra/sta-1736-osv-data-transfer-peers`

**Created**: 2026-11-01

**Status**: Clarified

**Linear**: STA-1736

**Clarifications status**: complete

**Input**: Core 0.2.1 release task (leader, 2026-11-01), due 2026-11-14 when the template's and Pro's 14-day OSV ignores
expire. `@stackra/data-transfer` depends on exceljs 4.4.0, the last release, which pulls uuid 8 and, through archiver
5 and unzipper, glob 7/10 and minimatch 3/5/9; no exceljs release or fork drops them, and a minimatch-11 override
breaks glob 7. `@stackra/app` and `@stackra/navigation` publish `react-router` as the exact peer `7.18.4`, which pins
every consumer.

## Impact

- **Apps touched**: none
- **Services touched**: none
- **Packages touched**: `packages/runtime/app`, `packages/experience/navigation` (the react-router peer);
  `packages/data/data-transfer` (the XLSX drivers without exceljs)
- **Cross-service events**: none
- **Tenancy and data**: none (the XLSX bytes read and written stay the same shape)
- **Secrets**: none
- **ADR needed**: no (ADR 0367 names the drivers, not the library)
- **New dependencies**: none new to the catalog; data-transfer takes `fflate` from `catalog:media` in place of exceljs
  (the leader decides before the driver change lands)
- **Deploy modes**: published packages only
- **Licence tier**: free
- **Docs to update**: data-transfer README
- **Lane**: bug
- **Change risk**: R2 (a reader and writer replaced behind the same ports)

## Requirements

- **FR-001** The `react-router` peer of `@stackra/app` and `@stackra/navigation` is `^7.18.4`.
- **FR-002** `@stackra/data-transfer` no longer depends on exceljs; its XLSX reader and writer keep the
  `TabularReader`/`TabularWriter` behaviour and tests.
- **FR-003** Core main's own OSV run is clean.

## Status history

- 2026-11-01 → Clarified (task from the leader for core 0.2.1)
