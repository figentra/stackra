# Feature Specification: Numeric value kind in entitlements (STA-824)

**Feature Branch**: `figentra/sta-666-wave12`

**Created**: 2026-10-26

**Status**: Implementing <!-- owner mode: code and tests written, nothing run -->

**Linear**: STA-824

**Clarifications status**: complete

**Input**: `EntitlementKind.Value` is a plain number the plan sets, counting no model; `EntitlementValueService.valueOf` reads it from the effective plan.

## Impact

- **Packages touched**: packages/security/entitlements
- **ADR needed**: 0408 (Proposed)
- **Lane**: lite

## Requirements

- **FR-001** A value reads as a number of zero or more, or undefined outside the plan.
- **FR-002** Another kind or a non-number grant throws a TypeError.
- **FR-003** A value gating a call passes when the plan sets it.

## Not built here

- Tests, typecheck and build are written but not run (owner mode).
