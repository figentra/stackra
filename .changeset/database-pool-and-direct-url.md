---
"@stackra/database": minor
"@stackra/gen": minor
"@stackra/runway": minor
---

Pool budget wiring and a direct URL (ADR 0473, stackra-254). `DatabaseConfig.pool` (`max`, `min`, `idleTimeout`)
sizes the pool of one instance and `PostgresDatabaseDriver.connect({ pool })` hands it to MikroORM for the primary and
each replica. The generated boot passes it, with `DATABASE_POOL_MAX` over `max`; runway's `poolMaxOf` gives that share
of the service's `poolBudget`. The migration and seed runners connect with `directDatabaseUrl()`
(`DATABASE_DIRECT_URL`, else `DATABASE_URL`), so they never go through a transaction-mode proxy.
