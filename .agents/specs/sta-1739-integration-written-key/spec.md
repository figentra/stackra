# Specification: a written key on an Integration

**Feature Branch**: `figentra/sta-1739-integration-written-key`

**Created**: 2026-11-01

**Status**: Clarified

**Linear**: STA-1739

**Clarifications status**: complete

**Input**: Owner decision 2026-11-01, through the leader: payment connector Integration keys stay `connectors.<vendor>`,
because tenant data stores them (`connections.integration_key`, OAuth app rows, unique per tenant and key). Gen derives
every key as `integrationKey(module, className)`, and a package member's module is its folder name, so
`packages/connectors/stripe` in figentra/pay yields `stripe.stripe`.

## Impact

- **Apps touched**: none
- **Services touched**: none
- **Packages touched**: `packages/communication/integrations` (`IntegrationOptions.key`, its check);
  `packages/developer/gen` (`build-manifest.function.ts`, its test)
- **Cross-service events**: none
- **Tenancy and data**: none in core; it keeps the stored `integration_key` values of products stable
- **Secrets**: none
- **ADR needed**: no (ADR 0294 decision 20: an identity is derived unless written once, as an action's `key` is)
- **New dependencies**: none
- **Deploy modes**: all, no change
- **Licence tier**: free
- **Docs to update**: integrations README
- **Lane**: lite
- **Change risk**: R1 (additive option; the derived key is unchanged when it is absent)

## Requirements

- **FR-001** `Integration({ key })` takes an optional written key `<snake>.<snake>`; `readIntegrationOptions` refuses any
  other shape when the class is declared.
- **FR-002** Gen's manifest uses the written key in place of `integrationKey(module, class)`, refuses a malformed one
  (`integration_key_invalid`), and `claim("integration:<key>")` still refuses a collision.
- **FR-003** Tests: the written key in the manifest, a malformed key refused, two Integrations writing one key refused.

## Status history

- 2026-11-01 → Clarified (owner decision through the leader)
