# Feature Specification: CI shows every failing typecheck and test task in one run

**Feature Branch**: `figentra/sta-1937-ci-continue`

**Created**: 2026-11-02

**Status**: Implementing

**Linear**: STA-1937

**Clarifications status**: complete

**Input**: turbo's default `--continue=never` stops at the first failed task, so the Quality Gate showed one failing
member per run (#226, #228: contracts, then devtools-kit, then the next). os#105 (STA-1926) made the same change.

## Impact

- **Apps touched**: none
- **Services touched**: none
- **Packages touched**: none
- **Cross-service events**: none
- **Tenancy and data**: none
- **Secrets**: none
- **ADR needed**: no
- **New dependencies**: none
- **Deploy modes**: none (the Quality Gate only)
- **Lane**: lite
- **Change risk**: R1

## Requirements

- **FR-001** The Typecheck and Test steps run `turbo run <task> --continue=dependencies-successful` (turbo 2.11.9).
- **FR-002** The job stays failing while any task fails: turbo exits 1.
- **FR-003** Test also runs after a failed Typecheck (not after a skipped one).
- **FR-004** The root `typecheck` and `test` scripts are unchanged: a local run still stops at the first failure.
