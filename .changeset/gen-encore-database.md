---
"@stackra/gen": minor
---

A service with a database gets `.stackra/encore/<member>/database.ts`, one Encore `SQLDatabase` over the compiled
`.stackra/migrations` (ADR 0238, stackra-250). `#stackra/boot` now connects with that database's connection string
instead of `DATABASE_URL`, passes the read replicas of `DATABASE_REPLICA_URLS` and the bound `DatabaseConfig`'s session
timeouts, and adds `StampSubscriber`. The boot's options are `{ signal }`. New export: `emitEncoreDatabase`.
