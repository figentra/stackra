# Feature Specification: Approval step runs only when a gate is bound (STA-813)

**Feature Branch**: `figentra/sta-666-wave12`

**Created**: 2026-10-26

**Status**: Implementing <!-- owner mode: code and tests written, nothing run -->

**Linear**: STA-813

**Clarifications status**: complete

**Input**: Wave 11 made every action fail without an `ApprovalGate`, breaking the iam, entitlements, queue and workflow pipelines. The step now runs only when a gate is bound; an action declaring `approval: true` still fails closed without one. ADR 0397 decision 5 amended. The testing pipeline no longer injects an open gate.

## Impact

- **Packages touched**: packages/application/actions
- **ADR needed**: 0397 (amended) (Proposed)
- **Lane**: lite

## Requirements

- **FR-001** With no `ApprovalGate` bound, an action call runs no approval step.
- **FR-002** `Action({ approval: true })` with no gate bound fails closed (`ApprovalGate is not bound`).
- **FR-003** A bound gate decides every action call; a query is never parked.
- **FR-004** No edit in iam, entitlements, queue or workflow is needed.

## Not built here

- Tests, typecheck and build are written but not run (owner mode).
