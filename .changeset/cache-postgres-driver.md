---
"@stackra/cache": minor
---

Add the `postgres` driver of `Cache` (`PostgresCacheDriver`, `./node`) for services with no Valkey: entries and tag
members in two unlogged tables in `postgres.schema` (default `cache`), a prefix `forget` over the "C"-collated primary
key, and a bounded sweep of dead rows per write (`postgres.sweep`, default 100). Its statements run through the new
`CacheSql` port (`./contracts`), which @stackra/database binds; `postgresCacheTables(schema)` gives the create
statements for the migration (STA-1438).
