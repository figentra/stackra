# Feature Specification: product on in-app inbox entries

**Feature Branch**: `figentra/sta-666-wave12`

**Created**: 2026-10-26

**Status**: Implementing <!-- owner mode: code and tests written, nothing run -->

**Linear**: STA-837

**Clarifications status**: complete

**Input**: OS gate-A gap (notifications SPEC gap 5): `InAppStore.append` takes no product.

## Impact

- **Apps touched**: none
- **Services touched**: none
- **Packages touched**: packages/communication/notifications
- **Cross-service events**: none
- **Tenancy and data**: none
- **Secrets**: none
- **ADR needed**: yes, 0422 (Proposed)
- **New dependencies**: none
- **Deploy modes**: same everywhere
- **Lane**: lite
- **Change risk**: R2

## Requirements

- **FR-001** `InAppMessage.product` is required and kept on the entry.
- **FR-002** `InAppStore.list(recipient, { product })` answers one product's entries; the fake implements it.

## Not built here

- The `database` InAppStore driver: OS notifications service.
- Tests, typecheck and build are written but not run (owner mode).
