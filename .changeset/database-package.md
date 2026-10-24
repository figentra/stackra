---
"@stackra/database": minor
---

Add `@stackra/database`, the MikroORM layer on Postgres: `CrudService<M>` with resource-table and metrics reads,
repositories, the graph reader, the `Migration`, `Macro` and `Seeder` kinds with a migration compiler that enforces the
ADR 0159 and 0160 rules, the `idx_`/`fk_`/`ck_` naming strategy, the unit of work and `ScopeRef` scope sessions, and the
`Factory` and `usePostgres` test helpers.
