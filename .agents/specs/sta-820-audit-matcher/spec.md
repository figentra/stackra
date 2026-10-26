# Feature Specification: Audit-field matcher in @stackra/actions/testing (STA-820)

**Feature Branch**: `figentra/sta-666-wave12`

**Created**: 2026-10-26

**Status**: Implementing <!-- owner mode: code and tests written, nothing run -->

**Linear**: STA-820

**Clarifications status**: complete

**Input**: `run(...)` hands back the call's audit entry (`RunResult.audit`) through a recording trail, and `expect(result).toHaveAudited({ outcome, code, fields })` asserts it.

## Impact

- **Packages touched**: packages/application/actions
- **ADR needed**: none (Proposed)
- **Lane**: lite

## Requirements

- **FR-001** `RunResult.audit` is the call's entry; undefined for a query.
- **FR-002** `toHaveAudited` matches outcome, code and a subset of fields, and fails on a non-run value.
- **FR-003** The app's own bound trail still receives every entry.

## Not built here

- Tests, typecheck and build are written but not run (owner mode).
