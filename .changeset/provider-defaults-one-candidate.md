---
"@stackra/integrations": patch
---

`RegionMapProviderDefaultsDriver` is `internal`: `SpeechService` builds it, so a host's `ProviderDefaults` has one
candidate, the market-pack driver. With two and no config to choose, a host that reached the port failed at boot with
`UnresolvedPortError` (Commerce channels).
