# Feature Specification: contracts: edit-freeze disposal kind in HoldRegistry

**Feature Branch**: `figentra/sta-666-wave12`

**Created**: 2026-10-26

**Status**: Implementing <!-- owner mode: code and tests written, nothing run -->

**Linear**: STA-833

**Clarifications status**: complete

**Input**: `Disposal.Edit` so an edit freeze is asked and logged as an edit.

## Impact

- **Apps touched**: none
- **Services touched**: none
- **Packages touched**: none
- **Cross-service events**: none
- **Tenancy and data**: none
- **Secrets**: none
- **ADR needed**: no
- **New dependencies**: none outside the workspace
- **Deploy modes**: same everywhere
- **Lane**: lite
- **Change risk**: R1

## Requirements

- **FR-001** `Disposal.Edit` in HoldRegistry, logged as an edit.

## Not built here

- Not built: `HoldRegistry` and `Disposal` live in `@stackra/database` (`packages/data/database/src/contracts`), not in `@stackra/contracts`, and that package is outside this build's folders.
