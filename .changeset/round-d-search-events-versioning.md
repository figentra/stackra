---
"@stackra/search": minor
"@stackra/events": minor
"@stackra/infra-gcp": minor
"@stackra/versioning": minor
"@stackra/infra-tools": minor
---

Round D. search: synonym sets per index and language as settings data (`search.synonyms`), applied by both Postgres
lanes; `find`/`page`/`facets` take `locale`. events: `IntegrationEvent({ crossRegion: true })`, the `RegionBus` port,
`crossRegionRecords` and `RegionBusFake`. infra-gcp: static egress addresses (`shared.network.egress.staticIps`).
versioning: deprecated dated versions are served until their support window ends (`VERSION_SUPPORT_MONTHS`), then
refused; `applyVersionHeaders`. infra-tools:
OCR and Photon images, tool databases and Valkey, Infisical secret sync, EBS-backed tools.
