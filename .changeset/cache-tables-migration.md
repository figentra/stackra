---
"@stackra/database": patch
"@stackra/cache": patch
---

The `postgres` cache driver's tables now ship as a migration: `database.0005_create_cache_tables` makes
`cache.entries` and `cache.set_members` (unlogged, "C"-collated keys, sweep indexes) with `if not exists`, so it adopts
tables a service made earlier from `postgresCacheTables("cache")` and keeps their rows. They are platform tables, with
no `tenant_id` and no row-level security: each key already carries its `CacheNamespace` prefix and the driver runs
outside the caller's transaction. The driver never creates a table; a missing one rejects the call.
