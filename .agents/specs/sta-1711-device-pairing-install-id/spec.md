# Feature Specification: pairing status check sends the opening install's id

**Feature Branch**: `figentra/sta-1711-device-pairing-install-id`

**Created**: 2026-10-31

**Status**: Clarified

<!-- Specs are public on GitHub: no secrets, customer data or details of an unfixed vulnerability (ADR 0120 D17). -->

**Linear**: STA-1711

**Clarifications status**: complete

**Input**: "The hub binds a pairing's status to the install that opened it, so the device's status check must say which install is asking."

## Status history

- 2026-10-31 → Clarified: lead-approved security fix requested by the leader

## Impact _(mandatory, answer every line before /speckit.clarify completes)_

- **Apps touched**: none
- **Services touched**: none
- **Packages touched**: `@stackra/devices`
- **Cross-service events**: none
- **Tenancy and data**: none
- **Secrets**: none
- **ADR needed**: no
- **New dependencies**: none
- **Deploy modes**: none
- **Lane**: lite
- **Change risk**: R2 (device pairing)
- **Licence tier**: free
- **Docs to update**: none

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Check a pairing as the install that opened it (Priority: P1)

**Acceptance Scenarios**:

1. **Given** a pairing opened by this install, **When** `check` runs, **Then** the request is `GET /device-pairings/:pairingId?deviceId=<install id>`.

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: `HttpDevicePairingDriver.check` shall send this install's id, URI-encoded, as the `deviceId` query parameter.

## Success Criteria _(mandatory)_

- **SC-001**: Driver tests cover the URL and that `begin` and `check` send the same id.
