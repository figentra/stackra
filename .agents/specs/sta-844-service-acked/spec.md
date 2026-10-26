# Feature Specification: cross-service service-acked contract

**Feature Branch**: `figentra/sta-666-wave12`

**Created**: 2026-10-26

**Status**: Implementing <!-- owner mode: code and tests written, nothing run -->

**Linear**: STA-844

**Clarifications status**: complete

**Input**: A cross-service "service acked" contract (signal and await-all) for ADR 0210 decision 6.

## Impact

- **Apps touched**: none
- **Services touched**: none
- **Packages touched**: packages/runtime/workflow, packages/developer/gen (public-id prefix)
- **Cross-service events**: `workflow.service.acked.v1` (integration)
- **Tenancy and data**: platform table without a scope policy, like the journal
- **Secrets**: none
- **ADR needed**: yes: 0427 decision 1 (Proposed)
- **New dependencies**: none
- **Deploy modes**: SaaS and on-prem alike
- **Lane**: lite
- **Change risk**: R2

## Requirements

- **FR-001** `ServiceAcked` integration event; `AllServicesAcked` signal.
- **FR-002** `ServiceAckSet` model (versioned, migration `workflow.0005`), `ServiceAckService.expect` and `ack`.
- **FR-003** `WorkflowExplorer` subscribes `ServiceAcked` and holds `AllServicesAcked` on the completing ack.

## Not built here

- Tenancy's provisioning workflow and each service's ack (OS).
- Tests, typecheck and build are written but not run (owner mode).
