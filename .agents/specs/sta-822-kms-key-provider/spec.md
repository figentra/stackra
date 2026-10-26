# Feature Specification: contracts: per-tenant KMS KeyProvider and per-subject keys

**Feature Branch**: `figentra/sta-666-wave12`

**Created**: 2026-10-26

**Status**: Implementing <!-- owner mode: code and tests written, nothing run -->

**Linear**: STA-822

**Clarifications status**: complete

**Input**: An AWS KMS `KeyProvider` driver per tenant and a per-subject key derivation.

## Impact

- **Apps touched**: none
- **Services touched**: none
- **Packages touched**: packages/foundation/contracts
- **Cross-service events**: none
- **Tenancy and data**: none
- **Secrets**: none
- **ADR needed**: yes, 0415 (Proposed)
- **New dependencies**: none outside the workspace
- **Deploy modes**: same everywhere
- **Lane**: lite
- **Change risk**: R1

## Requirements

- **FR-001** `AwsKmsKeyProviderDriver`: wrapped keys unwrapped by KMS under the tenant and key id context.
- **FR-002** `wrapTenantKey` makes a new wrapped key.
- **FR-003** `SubjectKeyProviderDriver`: HKDF per subject over the subject's salt.

## Not built here

- Other clouds' KMS drivers.
- Tests are written, not run (owner mode).
