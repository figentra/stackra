# Feature Specification: contracts: verified phone, locale and time zone on IdentityResolver

**Feature Branch**: `figentra/sta-666-wave12`

**Created**: 2026-10-26

**Status**: Implementing <!-- owner mode: code and tests written, nothing run -->

**Linear**: STA-838

**Clarifications status**: complete

**Input**: `IdentityResolver` returns the verified phone, locale and time zone of a principal.

## Impact

- **Apps touched**: none
- **Services touched**: none
- **Packages touched**: packages/foundation/contracts
- **Cross-service events**: none
- **Tenancy and data**: none
- **Secrets**: none
- **ADR needed**: yes, 0414 (Proposed)
- **New dependencies**: none outside the workspace
- **Deploy modes**: same everywhere
- **Lane**: lite
- **Change risk**: R1

## Requirements

- **FR-001** `VerifiedPrincipal` gains optional `phone` (verified, E.164) and `timeZone` (IANA).
- **FR-002** `IdentityResolver.principalOf(principalId)` returns the whole principal.

## Not built here

- `@stackra/identity` drivers must add `principalOf` (outside this build's folders); until then that package does not typecheck.
