# Feature Specification: API-key verification by key hash (STA-835)

**Feature Branch**: `figentra/sta-666-wave12`

**Created**: 2026-10-26

**Status**: Implementing <!-- owner mode: code and tests written, nothing run -->

**Linear**: STA-835

**Clarifications status**: complete

**Input**: `ApiKeyStore.findByHash` and `ApiKeyVerifierService.verify(key, origin)`: parse first (no lookup for a malformed key), hash, look up, constant-time compare, refuse revoked, expired, unbound-origin and browser-held secret keys as one `api_key_rejected`.

## Impact

- **Packages touched**: packages/security/identity
- **ADR needed**: 0410 (Proposed)
- **Lane**: lite

## Requirements

- **FR-001** A malformed key is refused without a lookup.
- **FR-002** Every refusal is the same code.
- **FR-003** An unreachable store fails the request.

## Not built here

- Tests, typecheck and build are written but not run (owner mode).
