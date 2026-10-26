# Feature Specification: Step-up assurance in the action pipeline (STA-814)

**Feature Branch**: `figentra/sta-666-wave12`

**Created**: 2026-10-26

**Status**: Implementing <!-- owner mode: code and tests written, nothing run -->

**Linear**: STA-814

**Clarifications status**: complete

**Input**: The call carries `ctx.assurance` (amr, auth_time, level) and an action may declare `stepUp: AssuranceLevel`, checked by a `StepUpCheck` port right after the permission.

## Impact

- **Packages touched**: packages/application/actions
- **ADR needed**: 0406 (Proposed)
- **Lane**: lite

## Requirements

- **FR-001** `CallOptions.assurance` reaches `ctx.assurance`.
- **FR-002** `stepUp` is validated as an `AssuranceLevel`.
- **FR-003** A declared step-up with no `StepUpCheck` bound fails closed; a weaker or missing assurance is refused by the driver before `handle`.

## Not built here

- Tests, typecheck and build are written but not run (owner mode).
