---
"@stackra/actions": minor
"@stackra/gen": minor
---

Serve a query's `cache` option on the server (ADR 0305 rule 31 as amended, STA-1445). `@stackra/actions` adds the
`cache` step to `PipelineStage` (inside the interceptors, before `handle`): with a `Cache` from `@stackra/cache` bound,
a query that declares `cache: { ttl, per?, invalidateOn? }` answers from its entry or runs `handle` once and stores
the answer. `CacheScope` (`Principal`, the default; `Scope`; `Site`) says whom one entry is shared with, and the key
carries the tenant, that holder and a fingerprint of the input and the request facts. `registerCachedQueries` and
`QueryCacheEvictorListener` forget a query's entries in the event's tenant after an `invalidateOn` event commits, and
`expectScopeCacheSafe` (`./testing`) proves a scope-wide query answers every caller the same. `@stackra/actions` now
depends on `@stackra/cache`.

`@stackra/gen` refuses `site_cache_reads_caller` (a site-cached query that reads its caller), registers the cached
queries with `registerCachedQueries`, binds the evictor in a service that declares `@stackra/cache`, and wires each
live query's refresh (`liveQueryRoutes`) in the boot of a service that runs `@stackra/realtime`. `emitBoot` takes the
manifest as a second argument.
