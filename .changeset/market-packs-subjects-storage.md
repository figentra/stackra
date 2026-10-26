---
"@stackra/market-packs": minor
---

Finish the market-pack loader (ADR 0385): `subjects` per key and `MarketContext.packFor(record, ruleKind)` answer each
rule kind from the market of its subject (location, buyer, entity or tenant), refusing a record without it
(`SubjectMarketMissingError`); overlays resolve at any depth with a product section per overlay; signed packs are
stored and fetched by content hash through the `PackStore` port and its `FilesystemPackStoreDriver`, loaded with
`fetchPacks` (new rejection `not_stored`), and shipped packs are read with `readPackAssets`. The `us` base pack and
seven state overlays ship as draft data assets.
