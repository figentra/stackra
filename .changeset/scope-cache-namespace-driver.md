---
"@stackra/scope": minor
"@stackra/cache": minor
---

Add `ScopeCacheNamespaceDriver`, the `scope` driver of the `CacheNamespace` port: cache keys sit behind the running
call's scope id (`""` for a platform call or outside every call). `CacheConfig` gains `namespace`
(`DriverName<CacheNamespace>`, `shared` by default), which selects the namespace driver, and `CacheNamespace` carries
the `cache.CacheNamespace` port key. A conformance test runs every `Cache` driver with two namespaces (ADR 0150
enforcement, STA-1442). New dependencies of `@stackra/scope`: `@stackra/actions`, `@stackra/cache`.
