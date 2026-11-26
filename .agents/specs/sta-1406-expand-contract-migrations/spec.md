# Feature Specification: drops, renames and backfills as expand and contract migration steps

**Feature Branch**: `figentra/sta-1406-expand-contract-dsl`

**Created**: 2026-11-26

**Status**: Implementing

**Tier**: feature

**Approver**: the CTO (the change risk's approval stop)

**Linear**: STA-1406

**Clarifications status**: complete

**Input**: The migration DSL of `@stackra/database` only added things. A column or table could be dropped or renamed only
through raw `schema.sql`, which skipped every safety rule, carried no check that the release which stopped using the
object had shipped first, and gave no way to keep an old name working while a rolling deploy runs two releases side by
side. There was no general check constraint, no exclusion constraint, and no `Backfill` kind, although ADR 0159
decision 3 decides that destructive steps wait for a later release and that backfills run as queue jobs. This change
adds the contract steps with a release gate, the expand halves of a rename, named checks and exclusions, and the
`Backfill` kind with its ledger and runner. It implements ADR 0159 decision 3 (and ADR 0334 rule 4: a data change is a
backfill job, never a migration) and uses the btree_gist approval of the ADR 0160 note of 2026-11-03. Validator-derived
CHECK constraints (the fourth part of the STA-1406 batch title) are not in this item; they stay on STA-1406.

### Sources

- `packages/data/database/src/core/types/blueprint.type.ts`, `schema-builder.type.ts` (the DSL before and after)
- `packages/data/database/src/core/records/blueprint.record.ts`, `schema.record.ts`, `column-change.record.ts`
- `packages/data/database/src/node/functions/migrate.function.ts`, `open-migration-session.function.ts` (the runner and
  its `schema_migrations_history` ledger)
- `packages/developer/gen/src/core/functions/order-migrations.function.ts`, `emit-migrations.function.ts` (edges, file
  names)
- ADR 0159 (decision 3; the 2026-10-23 and 2026-10-24 notes), ADR 0160 (note of 2026-11-03), ADR 0334 (rule 4), ADR
  0231 (names), ADR 0294 (decision 25: kind bases)
- The data-layer gap analysis rows db8, db9, sc10 and gov16 (batch stackra-285)

## Impact

- **Apps touched**: none
- **Services touched**: none
- **Packages touched**: database (the blueprint and schema builder types and records, the release and data gates, the
  rename sync trigger, `t.check`, `t.exclude`, `t.timeRange`, `t.dropIndex`, `t.dropCheck`, the `Backfill` kind, its
  runner, the node `backfill` entry, migration `database.0009_create_backfill_runs`, the runner's starting-version
  setting, tests, README, AGENTS.md); gen (`KIND_FILES` and `KIND_BASES` rows for `backfill`); coding-standard (the
  `base-matches-suffix` row for `.backfill.ts`); repo-checks (the `database/backfills` module group)
- **Public contract change**: additive. `Blueprint` gains `dropColumn`, `renameColumn`, `finishRenameColumn`, `check`,
  `dropCheck`, `exclude`, `dropIndex` and `timeRange`; `SchemaBuilder` gains `rename`, `finishRename`, `drop` and
  `requireBackfill`; the `.` entry exports `Backfill`, `runBackfill` and the types `BackfillBatch`, `BackfillClass`,
  `BackfillOptions`, `BackfillProgress`, `BackfillQuery`, `BackfillSession`, `ContractOptions`,
  `DroppedIndexOptions`, `ExclusionOptions`, `RenamedColumnOptions`, `RunBackfillOptions`; `./node` exports
  `backfill`. `compileMigration`'s `after` now also lists the ids its contract steps wait for. A member whose macro was
  named like one of the new methods would now collide at compile time (none in this repo).
- **Cross-service events**: none
- **Tenancy and data**: one new platform table, `database.backfill_runs` (declared with `t.platformTable`), holding a
  backfill key, a keyset cursor, counts, a finish time and an error code; no tenant data and no personal data. A
  table rename's view is `security_invoker`, so the older release reads through it under its own grants and row-level
  security. A backfill and the gates read and write every tenant's rows of their table, as the migrating role does.
- **Security and privacy**: every SQL fragment a step or backfill embeds is a one-line literal from the migration or the
  class, checked for `;`, `$$` and line breaks; keys a backfill reads back are quoted with `sqlLiteral`. A failed
  batch records its SQLSTATE or error class, never its message (which can quote row values).
- **Secrets**: none
- **ADR needed**: no new ADR; implements ADR 0159 decision 3 and ADR 0334 rule 4. The new `backfill` kind joins the kind
  tables citing ADR 0159 decision 3; whether ADR 0294's kind table also needs a note is the CTO's call at approval.
- **New dependencies**: none
- **Deploy modes**: same in all three
- **Licence tier**: free (MIT, this repo)
- **UI surfaces**: none
- **Docs to update**: `packages/data/database/README.md` (Dropping and renaming, Checks and exclusions, Backfills,
  Running migrations), `packages/data/database/AGENTS.md`, a changeset
- **Lane**: full
- **Change risk**: R2 (new migration DDL a production deploy runs, and a gate in the production migration runner; no
  auth, secret or HTTP shape change)

## Acceptance criteria

- **AC-001**: WHEN a migration drops a column, finishes a column or table rename, or drops a table, THE compiler SHALL
  open the step's transaction with a release gate on the stated `{ after }` migration and add that id to the
  migration's `after` edges.
- **AC-002**: IF `stackra db migrate` runs in a forward-only environment and the `after` migration was applied by the
  same run, or never, THEN THE gate SHALL refuse the migration before any change, naming the step and the release.
- **AC-003**: THE gate SHALL pass on a fresh database (the run started at version 0), in dev, preview and test, and
  wherever no `schema_migrations_history` exists (Encore's runner, tests).
- **AC-004**: WHEN a column is renamed (expand), THE compiled step SHALL add the new column and a trigger that keeps the
  two names equal on every insert and update, so a release writing either name leaves both equal.
- **AC-005**: WHEN a column rename is finished, THE step SHALL refuse while any row has the new column null and the old
  one set, and otherwise drop the trigger, its function and the old column.
- **AC-006**: WHEN a table is renamed (expand), THE step SHALL leave an updatable `security_invoker` view under the old
  name, so the older release reads and writes through it under its own row-level security; finishing the rename drops
  the view.
- **AC-007**: THE blueprint SHALL add a named check inline on a new table and `NOT VALID` plus a validation step on an
  existing one, add an exclusion constraint on a new table only, and drop an index concurrently in its own step.
- **AC-008**: EVERY step SHALL keep a dev inverse derived from the migration's literals (a dropped table: none), and
  every drop SHALL carry a reviewed squawk ignore, so the compiled files lint clean under CI's squawk rules.
- **AC-009**: A `Backfill` SHALL run in keyset batches of the rows still `pending`, fill each batch and move its cursor
  in one transaction, pause between batches, stop after `maxBatches`, resume from the ledger on the next run, and
  record a failed batch's SQLSTATE without moving the cursor.
- **AC-010**: `schema.requireBackfill` SHALL refuse a migration while any row of the table meets the pending predicate,
  and pass once none does.
- **AC-011**: gen, the lint kind table and the module-group check SHALL know `<name>.backfill.ts` under
  `database/backfills/`.

## Status history

- 2026-11-26 → Clarified (the gap rows db8, db9, sc10 and gov16; STA-1406)
- 2026-11-26 → Planned (plan.md)
- 2026-11-26 → Tasked (tasks.md)
- 2026-11-26 → Implementing (built on `figentra/sta-1406-expand-contract-dsl`)
