---
"@stackra/cache": minor
---

Add `CacheHealthIndicatorDriver`, the `HealthIndicator` named `cache` that reads one never-written key, and the `health` field of `CacheConfig` (probe timeout `PT2S`, `critical`) (STA-1379).
