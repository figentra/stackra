---
"@stackra/market-packs": minor
---

An interim `bundled` `ResolvedPackSource` (ADR 0386, amended 2026-11-09). It serves only the packs this package
bundles whose content hash the host pins in `packHashes`, and only `live` ones: an unpinned file is never read, and a
pin with no bundled pack, a changed file or a pinned draft is refused (`not_stored`, `hash_mismatch`, `not_live`). It
loads each pinned market lazily. In production it refuses at construction (`BundledPackSourceRefusedError`) unless the
host sets `allowBundledInProduction`, and warns once when that is set. `BUNDLED_PACK_HASHES` lists the live bundled
packs for a host to copy its pins from. `MarketPacksOptions` gains `environment` (`STACKRA_ENVIRONMENT`) and
`allowBundledInProduction`, and `PackRejection` gains `not_live`.
