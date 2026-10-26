# Feature Specification: inherited (ancestor-path) row policy

**Feature Branch**: `figentra/sta-666-wave12`

**Created**: 2026-10-26

**Status**: Implementing <!-- owner mode: code and tests written, nothing run -->

**Linear**: STA-842

**Clarifications status**: complete

**Input**: OS gate-A gap G2 (services/tenancy SPEC): templates seeded at the platform or product node are invisible to
tenants, so `checklist_templates` has no policy.

## Impact

- **Apps touched**: none
- **Services touched**: none
- **Packages touched**: packages/data/database
- **Cross-service events**: none
- **Tenancy and data**: a select-only policy widens reads to rows on the path above a granted path; writes unchanged
- **Secrets**: none
- **ADR needed**: yes, 0412 (Proposed)
- **New dependencies**: none
- **Deploy modes**: same everywhere
- **Lane**: lite
- **Change risk**: R2

## Requirements

- **FR-001** `RowLevelSecurityOptions.match` takes `inherited`, on an `ltree` column only.
- **FR-002** `inherited` compiles the `ancestor` policy plus `pol_<table>_<column>_inherited`, `for select using (column
@> array(granted paths))`, on create and on alter, each statement with its inverse.

## Not built here

- Switching `checklist_templates` in the OS tenancy migration to `inherited` (service code).
- Tests, typecheck and build are written but not run (owner mode).
