# Feature Specification: IdP admin port with ZITADEL and memory drivers (STA-834)

**Feature Branch**: `figentra/sta-666-wave12`

**Created**: 2026-10-26

**Status**: Implementing <!-- owner mode: code and tests written, nothing run -->

**Linear**: STA-834

**Clarifications status**: complete

**Input**: `IdpAdmin`: create users and machine users, deactivate and remove, end one or all sessions, run the device flow, set the login policy. `ZitadelIdpAdminDriver` over `IdpAdminConfig` (managed or own URL, `IDENTITY_IDP_ADMIN_TOKEN` secret); `MemoryIdpAdminDriver`.

## Impact

- **Packages touched**: packages/security/identity
- **ADR needed**: 0410 (Proposed)
- **Lane**: lite

## Requirements

- **FR-001** 409 is `idp_user_exists`; timeouts, network, 429 and 5xx are `idp_admin_unavailable`.
- **FR-002** Ending a gone session succeeds.
- **FR-003** Device-flow polls map the RFC 8628 errors.
- **FR-004** Login policy values are data pushed through the port.

## Not built here

- Tests, typecheck and build are written but not run (owner mode).
