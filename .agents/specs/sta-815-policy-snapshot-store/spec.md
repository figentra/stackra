# Feature Specification: Tenant-scoped Postgres policy snapshot store and intake (STA-815)

**Feature Branch**: `figentra/sta-666-wave12`

**Created**: 2026-10-26

**Status**: Implementing <!-- owner mode: code and tests written, nothing run -->

**Linear**: STA-815

**Clarifications status**: complete

**Input**: `PolicySnapshotStore` is partitioned by tenant; `PostgresPolicySnapshotStoreDriver` (`./node`) keeps one row per tenant and principal in `iam.policy_snapshots` under a forced equality policy; `PolicySnapshotIntakeService` is the listener body that decodes and stores the event.

## Impact

- **Packages touched**: packages/security/iam
- **ADR needed**: 0407 (Proposed)
- **Lane**: lite

## Requirements

- **FR-001** Read and write take the tenant; one tenant's snapshot never answers another.
- **FR-002** Only a higher version replaces the held one, in one upsert.
- **FR-003** A malformed event throws and stores nothing.

## Not built here

- Tests, typecheck and build are written but not run (owner mode).
