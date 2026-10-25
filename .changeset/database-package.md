---
"@stackra/database": minor
---

Add `@stackra/database`, the MikroORM layer on Postgres: `CrudService<M>` with resource-table and metrics reads,
repositories, the graph reader, the `Migration`, `Macro` and `Seeder` kinds with a migration compiler that enforces the
ADR 0159 and 0160 rules, the `idx_`/`fk_`/`ck_` naming strategy, the unit of work and `ScopeRef` scope sessions, gapless
document numbers (the `Sequence` kind, `SequenceService` with offline reservation blocks, and the scoped counter, block
and void tables of ADR 0342), the record-visibility filter seam of ADR 0333 (`VisibilityFilter`,
`connectVisibilityFilter`), and the `Factory` and `usePostgres` test helpers.
