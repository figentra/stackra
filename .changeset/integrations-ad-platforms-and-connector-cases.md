---
"@stackra/integrations": minor
---

Marketplaces, 3PLs and ad platforms (STA-793, stackra-45). `./contracts` adds `AdPlatformConnector` (server-side
conversions and customer-audience sync), `ConversionEvent`, `MatchKeys` and `AdBatchResult`; `ConnectorKind.AdPlatform`
(`ad_platform`) and `ConnectorGateway#ads`; `matchKeysOf` normalises and SHA-256 hashes a person's email, phone (E.164
or digits, a Connection setting) and id. The managed client sends an OAuth token in the header and layout `auth.token`
names (`x-amz-access-token`, `access-token`) and adds the Integration's new `headers` option (Google Ads'
`developer-token`). `./testing` adds `runConnectorCase` and `ConnectorCase`/`ConnectorStep` (any connector contract),
`runFulfilmentCase` and `FulfilmentCase` (3PL, the repeat hand-over built in) and `MemoryAdPlatform`. The Amazon, noon,
Salla, Zid, Meta, TikTok, Snap, Google and 3PL connectors are OS integrations connectors (ADR 0443 decision 7),
certification pending.
