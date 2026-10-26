# Feature Specification: market-packs: injectable resolved-pack source

**Feature Branch**: `figentra/sta-666-wave12`

**Created**: 2026-10-26

**Status**: Implementing <!-- owner mode: code and tests written, nothing run -->

**Linear**: STA-831

**Clarifications status**: complete

**Input**: A `ResolvedPackSource` port that hands a service its deployment's verified packs and answers `valueFor(market, key)`, bound through a module.

## Impact

- **Apps touched**: none
- **Services touched**: none
- **Packages touched**: packages/foundation/market-packs
- **Cross-service events**: none
- **Tenancy and data**: none
- **Secrets**: none
- **ADR needed**: yes, 0418 (Proposed)
- **New dependencies**: none outside the workspace
- **Deploy modes**: same everywhere
- **Lane**: lite
- **Change risk**: R1

## Requirements

- **FR-001** `ResolvedPackSource` with `packs()` and `valueFor(market, key, options)`.
- **FR-002** `store` driver: configured hashes fetched from `PackStore`, verified against configured trusted keys, loaded once, retried after a failure.
- **FR-003** `memory` driver.
- **FR-004** `MarketPacksConfig` (`source`, `packHashes`, `trustedKeys`) and `MarketPacksModule` exporting the port (`./node`).

## Not built here

- The OS STA-763 loader driver.
- Lockfile: `@stackra/config` moves to dependencies and `@stackra/validation` is new; the lockfile needs the link (not edited here).
