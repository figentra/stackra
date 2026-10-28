---
"@stackra/cache": minor
"@stackra/locking": minor
"@stackra/actions": patch
---

`Cache` gains tags and `forgetTag(tag)` (`put` and `remember` take `{ tags }`), stale-while-revalidate
(`remember(..., { stale })`), one fill across instances (`remember(..., { lock: true })` over the new `CacheLock` port)
and lifetime jitter (`cache.jitter`), plus the `CacheMetrics` port with the `none`, `counting` and `logger` drivers
(`cache.metrics`). Every driver now runs one shared `storedCache` over an entry store; the Valkey driver indexes keys
and tags in sorted sets, so `forget` no longer walks `SCAN` and no command touches two keys. New config fields `lock`,
`metrics`, `jitter` and `fill` (`wait`, `poll`). The driver constructors take the `CacheMetrics` port (and the Valkey and
Workers drivers the `CacheLock` port). `@stackra/locking` ships `LocksCacheLockDriver` (`cache.lock: locks`) and now
depends on `@stackra/cache`. `@stackra/actions`' test fakes implement `forgetTag` (STA-1435).
