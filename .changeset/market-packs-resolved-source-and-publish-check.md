---
"@stackra/market-packs": minor
---

Serve a deployment's verified packs and check packs before they are signed (ADR 0417, 0418). `ResolvedPackSource` is
an injectable port with `packs()` and `valueFor(market, key, options)`, exported by the new `MarketPacksModule`
(`./node` entry), with a `store` driver (the hashes in `MarketPacksConfig`, fetched from `PackStore` and verified
against the configured trusted keys) and a `memory` driver. `PackSchemaRegistry` checks every key and value of a pack
against the registered section schemas (JSON Schema per key, owned by OS or the product) and asks root packs for their
required keys; `overlayFloorIssues` refuses an overlay that drops or loosens a parent's legal floor. The draft `us`
pack now carries the ADR 0405 identity formats, the optional 5-cent cash rounding and the ADR 0392 billing terms.
