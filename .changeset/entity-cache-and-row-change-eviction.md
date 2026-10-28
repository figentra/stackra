---
"@stackra/model": minor
"@stackra/database": minor
"@stackra/cache": patch
---

Add the `Cached({ ttl })` model trait and `cacheTtlOf` (@stackra/model; a model with encrypted fields is refused).
`CrudService.findOne` and `findOneOrFail` by `{ id }` alone, outside a transaction and with no visibility condition,
read a `Cached` model's row through the shared `Cache` (MikroORM's result cache over `EntityResultCacheAdapter`, set by
`PostgresDatabaseDriver`), keyed by `CacheKey.of(Model, id, scopeId, scopeNodeId)`. New `CacheInvalidationService`, an
outbox change consumer that forgets `CacheKey.of(Model, id)` after every committed change. @stackra/database now
depends on `@stackra/cache` (data-layer gaps ca4, ca5, cdc10; STA-1431).
