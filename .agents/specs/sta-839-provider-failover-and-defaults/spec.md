# Feature Specification: ProviderResolver failover list, own-or-managed and a market-pack ProviderDefaults driver

**Feature Branch**: `figentra/sta-666-wave12`

**Created**: 2026-10-26

**Status**: Implementing <!-- owner mode: code and tests written, nothing run -->

**Linear**: STA-839

**Clarifications status**: complete

**Input**: OS gate-A gap (notifications SPEC gaps 3, 6 and 8).

## Impact

- **Apps touched**: none
- **Services touched**: none
- **Packages touched**: packages/communication/integrations
- **Cross-service events**: none
- **Tenancy and data**: none
- **Secrets**: none
- **ADR needed**: yes, 0422 (Proposed)
- **New dependencies**: `@stackra/market-packs` (workspace) in @stackra/integrations
- **Deploy modes**: same everywhere
- **Lane**: lite
- **Change risk**: R2

## Requirements

- **FR-001** `ProviderResolver#candidates` answers the ordered failover list with `ProviderMode` per entry; `resolve` is lazy over the same walk.
- **FR-002** Both take the Market as an argument, falling back to `MarketContext`.
- **FR-003** `ProviderChoice.connectionId` is optional (a BYO-only provider).
- **FR-004** `MarketPackProviderDefaultsDriver` over `ProviderPackSource` reads `providers.<capability>` from the pack.

## Not built here

- The host `ProviderPackSource` driver (pack fetch and platform Connections): OS (STA-763).
- Pack data for `providers.<capability>` lists: market packs.
- The lockfile link of the new workspace dependency: the orchestrator.
- Tests, typecheck and build are written but not run (owner mode).
