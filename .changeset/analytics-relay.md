---
"@stackra/analytics": minor
---

Analytics relay (STA-1624, ADR 0483). Apps send product analytics only to the analytics service: the new `relay`
driver (`.` and `./native`) posts the envelope deliveries unchanged to `<ingestOrigin>/analytics/batches` with the
`Stackra-Consent` header, and holds no vendor key, SDK or host. `./node` adds `IngestAnalyticsBatchAction`
(`analytics_batch.ingest`, public), which reads the verified consent snapshot, binds deliveries to its subject, strips
`denyProperties` and publishes one `AnalyticsBatchAccepted` per granted destination, and `FanOutAnalyticsListener`,
which sends each to its destination's driver. `AnalyticsContext` gains a coarse `device` record, which the PostHog
driver maps to `$os`, `$os_version`, `$app_build` and `$device_type` (with `$app_version`); a server send turns
PostHog's GeoIP off. `ANALYTICS_INGEST_PATH` joins `./contracts`.
