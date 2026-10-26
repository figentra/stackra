# Feature Specification: support: public canonical-JSON hash helper

**Feature Branch**: `figentra/sta-666-wave12`

**Created**: 2026-10-26

**Status**: Implementing <!-- owner mode: code and tests written, nothing run -->

**Linear**: STA-827

**Clarifications status**: complete

**Input**: Export one canonical JSON and its hash; access-log uses it.

## Impact

- **Apps touched**: none
- **Services touched**: none
- **Packages touched**: packages/foundation/support
- **Cross-service events**: none
- **Tenancy and data**: none
- **Secrets**: none
- **ADR needed**: yes, 0416 (Proposed)
- **New dependencies**: none outside the workspace
- **Deploy modes**: same everywhere
- **Lane**: lite
- **Change risk**: R1

## Requirements

- **FR-001** `canonicalJson`, byte for byte the access-log chain form.
- **FR-002** `canonicalHash`, SHA-256 lowercase hex.

## Not built here

- Switching `@stackra/access-log` to the helper: outside this build's folders (its own build cites ADR 0416).
