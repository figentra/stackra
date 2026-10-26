# Feature Specification: Permission selectors by kind and risk (STA-818)

**Feature Branch**: `figentra/sta-666-wave12`

**Created**: 2026-10-26

**Status**: Implementing <!-- owner mode: code and tests written, nothing run -->

**Linear**: STA-818

**Clarifications status**: complete

**Input**: A role entry `@read` or `@risk:<level>`, optionally behind a prefix, covers every registered permission it selects; never a system or restricted one for a grant.

## Impact

- **Packages touched**: packages/security/iam
- **ADR needed**: 0407 (Proposed)
- **Lane**: lite

## Requirements

- **FR-001** `@read` picks L0 and L1; `@risk:lN` picks that level.
- **FR-002** A prefix narrows by whole segments.
- **FR-003** A deny's selector may pick system and restricted permissions.

## Not built here

- Tests, typecheck and build are written but not run (owner mode).
