---
"@stackra/cache": minor
---

Add `@stackra/cache`, the cache of the programming model v3.1: the `Cache` port (`get`, `put`, `remember`, `forget`;
exported from `./contracts` only), where `remember` shares one load between concurrent callers and `forget` drops a key
and every key it covers; `CacheKey.of(Model, ...parts)`, the only maker of a key; the `CacheNamespace` port that every
driver puts in front of each key, with `SharedCacheNamespaceDriver` as its default; `MemoryCacheDriver` (least recently
read dropped past the bound, expiry from the `Clock`); and the `CacheConfig` configuration (`cache.cache`,
`maxEntries`) with its shipped schema `CacheConfig$`.
