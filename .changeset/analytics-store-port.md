---
"@stackra/analytics": minor
---

`./contracts` adds the `AnalyticsStore` port, Stackra's own store of analytics deliveries (ADR 0190 decision 3 as
amended), with its `AnalyticsStoreQuery`: `append` keeps a delivery once per event id, `scan` reads a capture-time
window oldest first, and `erasePerson` deletes a subject's identified and anonymous deliveries. `./node` adds its
`memory` driver, `MemoryAnalyticsStoreDriver`, for tests and previews. The ClickHouse and DuckDB drivers are Pro and
wait on ADR 0227, which still defers an OLAP engine.
