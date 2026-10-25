---
"@stackra/cache": minor
---

Add the decided `Cache` drivers behind the existing port: `StorageCacheDriver` (`storage`, `.`) over the client storage
`cache` area, `ValkeyCacheDriver` (`valkey`, new `./node` entry) over a Valkey server named by the `CACHE_VALKEY_URL`
secret, and `WorkersCacheDriver` (`workers`, new `./worker` entry) over the Workers KV namespace bound under
`cache.workers.binding`. Each keeps namespaced keys, expiry on the `Clock`, the covering `forget` and per-process
single-flight. `CacheConfig` gains `driver`, `valkeyUrl`, `valkey.keyPrefix` and `workers.binding`. No Encore cache
driver: see the README.
