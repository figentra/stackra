---
"@stackra/database": minor
---

Test with every approved extension (gap db19). `usePostgres()` now runs the Stackra test image by default, built once
per test process from PostGIS 3.6 on Postgres 18 plus pgvector, so integration tests can create `vector`, `postgis` and
the other approved extensions; `usePostgres({ image })` still runs any other image. `MemoryDatabaseDriver` loads
pgvector into PGlite through `@electric-sql/pglite-pgvector`, so unit tests can use vector columns. New optional peers
of `./testing`: `testcontainers` and `@electric-sql/pglite-pgvector`.
