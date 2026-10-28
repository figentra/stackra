---
"@stackra/gen": minor
---

A service's `stackra gen` now writes its compiled migrations to `.stackra/migrations/` (`compileMigrations`,
`orderMigrations`, `emitMigrations`, `migrationId`): its own and its declared packages' migrations, compiled with the
member's `@stackra/database`, ordered by module number and `Migration({ after })` across members, one `.up.sql` per
step with its `.down.sql` inverse and the `-- stackra:transactional=false` header for online steps. Stale files are
removed, and `gen --check` reports a stale, missing or leftover one (stackra-248, ADR 0159).
