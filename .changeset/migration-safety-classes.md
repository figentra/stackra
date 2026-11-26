---
"@stackra/gen": minor
"@stackra/runway": minor
---

Gen now sorts every compiled migration statement into one of the four ADR 0159 classes: `additive`, `online`,
`contract` or `banned` (STA-2866). A migration takes the highest class among its statements, and `contract` and
`banned` count as destructive. A service with migrations gets `.stackra/migration-safety.json`
(`stackra.migration-safety/v1`) next to its compiled SQL. Gen refuses a banned statement as `migration_banned`. A
banned statement is a data write, an index built on an existing table without `CONCURRENTLY`, a lock or a table
rewrite. Nine released migrations already hold one. They are frozen, so gen keeps compiling them and classes them
`banned`. New exports: `classifyMigrationStatement`, `classifyMigrations`, `emitMigrationSafety`,
`MIGRATION_SAFETY_FILE` and the `MigrationSafety*` types.

`runway evidence` now fills `destructive` and `destructiveMigrations` instead of always writing `null`:

- A service target reads the classes of each service it ships.
- A client target (`eas`, `mintlify`, `npm`, `electron-release`) is `false`.
- A Workers member is `false` when its config has no Durable Object migrations and no D1 binding.

For a service target the command also writes `runway-migrations-<environment>.json`, the list of migrations the deploy
ships. The next deploy to the same environment passes that file back with the new `--previous <file>` option, so only
a destructive migration that is new to the environment counts. Without it, a service that holds a destructive migration
leaves `destructive` at `null`, so the owner approves the deploy.
