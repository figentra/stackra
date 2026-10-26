---
"@stackra/database": minor
---

Add the database memory driver to `@stackra/database/testing` (ADR 0266, addendum 2026-10-26). `MemoryDatabaseDriver` runs
PGlite in process through `@mikro-orm/pglite` and applies the member's compiled migrations, or the entity schema, before the
first query. The testing plugin connects a fresh one per testing module unless another database is connected, so
`createTestingModule(X).useDrivers("memory")` needs no Docker. `app.repository(Model)` returns the model's repository
(`repositoryOf`). New peer dependencies of the testing entry: `@electric-sql/pglite` and `@mikro-orm/pglite`.
