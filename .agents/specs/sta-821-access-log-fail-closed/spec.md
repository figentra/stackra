# Feature Specification: Access log fails closed by class, and an outbox sink (STA-821)

**Feature Branch**: `figentra/sta-666-wave12`

**Created**: 2026-10-26

**Status**: Implementing <!-- owner mode: code and tests written, nothing run -->

**Linear**: STA-821

**Clarifications status**: complete

**Input**: `AccessLogConfig.failClosed` (financial and health by default) and `@AccessLogged({ failClosed: true })` make a lost record refuse the read; `OutboxAccessLogSinkDriver` sends `AccessRecorded` events; the chain hash uses support's `canonicalHash` (STA-827).

## Impact

- **Packages touched**: packages/security/access-log
- **ADR needed**: 0409 (Proposed)
- **Lane**: lite

## Requirements

- **FR-001** A sink failure is always logged; it rejects only for a fail-closed class.
- **FR-002** The outbox sink writes one event per record with the tenant and correlation id.
- **FR-003** The chain hash is unchanged byte for byte (pinned test).

## Not built here

- Tests, typecheck and build are written but not run (owner mode).
