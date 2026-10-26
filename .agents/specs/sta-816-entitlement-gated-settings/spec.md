# Feature Specification: entitlement-gated @Setting values

**Feature Branch**: `figentra/sta-666-wave12`

**Created**: 2026-10-26

**Status**: Implementing <!-- owner mode: code and tests written, nothing run -->

**Linear**: STA-816

**Clarifications status**: complete

**Input**: OS gate-A gap (access SPEC gap 3): `@Setting` cannot name an entitlement, so access gates Enterprise values by hand.

## Impact

- **Apps touched**: none
- **Services touched**: none
- **Packages touched**: packages/state/settings
- **Cross-service events**: none
- **Tenancy and data**: grants are read per target (scope node and user)
- **Secrets**: none
- **ADR needed**: yes, 0420 (Proposed)
- **New dependencies**: none
- **Deploy modes**: same everywhere
- **Lane**: lite
- **Change risk**: R2

## Requirements

- **FR-001** `@Setting({ entitlement, entitlementValues })`, recorded and refusing a blank or empty gate.
- **FR-002** `SettingEntitlementSource` port and `MemorySettingEntitlementSourceDriver`; fail closed when unbound.
- **FR-003** Every read path drops an unentitled value to the default (provenance `entitlement`); every write path refuses it with `entitlement_required`.
- **FR-004** `fakeResolver({ grants })`.

## Not built here

- Gen carrying `entitlement` and `entitlementValues` into `SettingKeyInput` and binding `SettingEntitlementSource` in the wiring: @stackra/gen.
- The production driver over `EntitlementSource`: the host (OS access or billing).
- Tests, typecheck and build are written but not run (owner mode).
