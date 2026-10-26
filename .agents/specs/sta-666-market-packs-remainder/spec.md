# Feature Specification: @stackra/market-packs remainder (nested overlays, subjects, storage, US seed packs)

**Feature Branch**: `figentra/sta-666-wave11`

**Created**: 2026-10-26

**Status**: Implementing <!-- owner mode: code and tests written, nothing run -->

**Linear**: STA-666

**Clarifications status**: complete

**Input**: Finish `@stackra/market-packs` (ADR 0370): nested `extends`, product sections per overlay, `subject` per
key with `MarketContext.packFor(record, ruleKind)`, the `us` base plus seven state overlays as draft, pack fetch and
storage by content hash, the production `FiscalPackSource` binding, and ADRs for the two-market tenant rule and the
signing-key holder.

## Impact

- **Apps touched**: none
- **Services touched**: none
- **Packages touched**: packages/foundation/market-packs; packages/commerce/fiscal (the `FiscalPackSource` binding only)
- **Cross-service events**: none
- **Tenancy and data**: no table. Pack data is platform data; the draft US seed packs ship as `data/` assets
- **Secrets**: none. Trusted keys are public configuration; the signing key stays with the release service (ADR 0386)
- **ADR needed**: yes, 0385 (subject rule, nested overlays, storage) and 0386 (signing-key holder), both Proposed
- **New dependencies**: workspace only (`@stackra/assets`, `@stackra/container`, `@stackra/filesystem`; dev
  `@stackra/config`); `@stackra/fiscal` gains `@stackra/market-packs`. The lockfile is not updated (owner mode)
- **Deploy modes**: same everywhere; the disk behind `PackStore` is `@stackra/filesystem` configuration
- **Lane**: lite
- **Change risk**: R2 (tax and legal values are read through it)

## Requirements

- **FR-001** `extends` resolves at any depth, parent first; a loop of any length is refused (`overlay_cycle`).
- **FR-002** A section declared on an overlay (`us-ca-sf` / `restaurant`) resolves beside its base and overlays the
  parent's section.
- **FR-003** `subjects` maps a key prefix to `location`, `buyer`, `entity` or `tenant`; `MarketContext.packFor`
  returns the resolved market of the record's subject, the tenant's when none is named, and refuses a missing market.
- **FR-004** `us` and `us-ny`, `us-nj`, `us-ca`, `us-tx`, `us-il`, `us-mi`, `us-fl` ship as `draft` and load only when
  drafts are accepted.
- **FR-005** `PackStore` with a `FileSystem` driver keyed by content hash; `fetchPacks` verifies each hash it loads;
  `readPackAssets` reads shipped packs through `AssetLibrary`.
- **FR-006** `MarketPackFiscalPackSourceDriver` answers `FiscalPackSource` from `fiscal.invoice` and `fiscal.till`.

## Not built here

- `MarketPaymentDefaults` production binding (`@stackra/payments`, outside this run's folders).
- The section schema registry and the publish check that an overlay floor is not looser than its parent (X2-19).
- Tests, typecheck and build are written but not run (owner mode).
