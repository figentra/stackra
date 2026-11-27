---
"@stackra/gen": minor
"@stackra/runway": minor
---

Gen now sorts every compiled migration statement into one of the four ADR 0159 classes: `additive`, `online`,
`contract` or `banned` (STA-2866). A migration takes the highest class among its statements, and `contract` and
`banned` count as destructive. Each top-level statement of a raw `schema.sql()` string is classed alone. Every
service gets `.stackra/migration-safety.json` (`stackra.migration-safety/v1`) next to its compiled SQL, with no rows
when it has no migration. Gen refuses a banned statement as `migration_banned`. A banned statement is a data write, an
index built on an existing table without `CONCURRENTLY`, a lock or a table rewrite. A table made with
`CREATE TABLE IF NOT EXISTS` counts as existing, since it may be adopted. Gen never guesses safe: a statement it cannot
read is `contract`, a read or a `DO` block that calls a function outside a short read-only list (aggregates, settings,
advisory locks) is `contract`, `SELECT … INTO` and a filled `CREATE TABLE … AS` are `banned`, and comments, literals and quoted names never change the
class. Ten released migrations already hold one. They are frozen, so gen keeps compiling them and classes them
`banned`. New exports: `classifyMigrationStatement`, `classifyMigrations`, `emitMigrationSafety`,
`MIGRATION_SAFETY_FILE` and the `MigrationSafety*` types.

`runway evidence` now fills `destructive` and `destructiveMigrations` instead of always writing `null`:

- A service target reads the classes of each service it ships.
- A client target (`eas`, `mintlify`, `npm`, `electron-release`) is `false`.
- A Workers member is `false` when its config has no Durable Object migrations and no D1 binding.

A service whose safety file is missing (gen has not run, as on a fresh checkout) is `null`, never `false`.

The new `runway migrations:record` command runs after a deploy step succeeded and writes
`runway-migrations-<environment>.json`, the migrations that deploy applied. The next deploy to the same environment
passes that record to `runway evidence` with the new `--previous <file>` option, so only a destructive migration that
is new to the environment counts. Without it, a service that holds a destructive migration leaves `destructive` at
`null`, so the owner approves the deploy.
