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
  runner, the node `backfill` entry, migration `database.0009_create_backfill_runs`, the runner's starting-version and
  release settings, the `release_id` column of `schema_migrations_history`, `db:migrate --release`, tests, README,
  AGENTS.md, the `schema_migrations_releases` ledger of finished release runs); cli (`stackra db migrate --release`
  and the `DatabaseRunner` type's `release`); gen (`KIND_FILES` and `KIND_BASES` rows for `backfill`); coding-standard
  (the `base-matches-suffix` row for `.backfill.ts`); repo-checks (the `database/backfills` module group); the docs
  app's generated structure standards page (the `database/backfills/` row)
- **Public contract change**: additive. `Blueprint` gains `dropColumn`, `renameColumn`, `finishRenameColumn`, `check`,
  `dropCheck`, `exclude`, `dropIndex` and `timeRange`; `SchemaBuilder` gains `rename`, `finishRename`, `drop` and
  `requireBackfill`; the `.` entry exports `Backfill`, `runBackfill` and the types `BackfillBatch`, `BackfillClass`,
  `BackfillOptions`, `BackfillProgress`, `BackfillQuery`, `BackfillSession`, `ContractOptions`,
  `DroppedIndexOptions`, `ExclusionOptions`, `RenamedColumnOptions`, `RunBackfillOptions`; `./node` exports
  `backfill`. `compileMigration`'s `after` now also lists the ids its contract steps wait for. `migrate` and
  `DatabaseRunner.migrate` (database and cli) take an optional `release` (else `STACKRA_RELEASE`), `db:migrate` (the
  member console command and the `stackra db migrate` bin) gains `--release`, and the runner adds a nullable
  `release_id` column to its `schema_migrations_history` ledger and a `schema_migrations_releases(release_id,
through_version, finished_at)` table of finished release runs. A forward-only run on a database with applied files
  that would apply a contract step together with the migration it waits for is now refused before any change. A member whose macro was
  named like one of the new methods would now collide at compile time (none in this repo).
- **Cross-service events**: none
- **Tenancy and data**: one new platform table, `database.backfill_runs` (declared with `t.platformTable`), holding a
  backfill key, a keyset cursor, counts, a finish time and an error code; no tenant data and no personal data. A
  table rename's view is `security_invoker`, so the older release reads through it under its own grants and row-level
  security. A backfill and the data gate read and write every tenant's rows of their table, so they run with
  `row_security` off: a role that is neither superuser nor `BYPASSRLS` is refused (SQLSTATE 42501) on a table under
  row-level security instead of seeing the rows its policy shows. They run on `DATABASE_DIRECT_URL` as the migrating
  role, which bypasses row security; the runtime role never does.
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
  Running migrations), `packages/data/database/AGENTS.md`, `apps/docs/src/docs/standards/structure.mdx` (generated),
  the changesets
- **Lane**: full
- **Change risk**: R2 (new migration DDL a production deploy runs, and a gate in the production migration runner; no
  auth, secret or HTTP shape change)

## Acceptance criteria

- **AC-001**: WHEN a migration holds a contract step, THE compiler SHALL open the step's transaction with a release
  gate on the migration the step names as its release (a dropped column or table, a finished rename), and add that id
  to the migration's after edges.
- **AC-002**: IF a forward-only run's release applied the named migration THEN THE release gate SHALL refuse the step
  before any change, naming the step, the migration and the release, whether the run is that release's first or a
  retry of the same deploy; a migration never applied, and a run that names no release, are refused the same way.
  IF a forward-only run with files to apply names no release on a database with an applied file THEN THE runner
  SHALL refuse it before any change, so no file is recorded without the release a later retry names. IF a
  forward-only run on a database with an applied file would apply a contract step and the migration it waits for
  together THEN THE runner SHALL refuse it before any change, naming both files. WHILE no run of a release other than
  this run's, holding the named migration, has finished since that migration was applied, THE release gate SHALL
  refuse the step, so a release whose run failed (its code never live) never lets a later one drop what the release
  before it reads; THE runner SHALL record a named forward-only run's release as finished only once it applied every
  pending file, and SHALL set the gate's settings transaction-locally in each transactional file (ADR 0495).
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
- **AC-008**: THE compiler SHALL keep a dev inverse for every step, derived from the migration's literals (a dropped
  table has none), and write a reviewed squawk ignore above every drop, so the compiled files lint clean under CI's
  squawk rules.
- **AC-009**: WHEN a backfill runs, THE runner SHALL take keyset batches of the rows still pending, fill each batch and
  move its cursor in one transaction, pause between batches, stop after the batch limit, resume from the ledger on the
  next run, and record a failed batch's SQLSTATE without moving the cursor.
- **AC-010**: WHILE any row of the table meets the pending predicate, THE backfill gate SHALL refuse the migration, and
  it SHALL pass once none does.
- **AC-011**: THE gen kind tables, the lint kind table and the module-group check SHALL know a backfill file under
  `database/backfills/`.
- **AC-012**: IF the migrating role lacks SELECT or row security hides rows from it THEN THE data gate SHALL refuse
  the migration, naming the table, the role and both causes, and a backfill batch fails with SQLSTATE 42501 without
  finishing, rather than either finding no rows (a `FORCE` table, a role neither superuser nor `BYPASSRLS`).
- **AC-013**: IF a column rename's new column has a default, a generation or NOT NULL THEN THE compiler SHALL refuse the
  migration, so the rows the copy has not reached keep the new column null.

## Status history

- 2026-11-26 → Clarified (the gap rows db8, db9, sc10 and gov16; STA-1406)
- 2026-11-26 → Planned (plan.md)
- 2026-11-26 → Tasked (tasks.md)
- 2026-11-26 → Implementing (built on `figentra/sta-1406-expand-contract-dsl`)
- 2026-11-26 → Implementing (review fixes: AC-002 compares releases, not runs; AC-012 row security; AC-013 rename
  defaults)
- 2026-11-27 → Implementing (review fixes: AC-002 a forward-only run naming no release on a database with applied
  files is refused before any change; AC-012 the refusal names a missing SELECT grant too; follow-ups STA-2901,
  STA-2902, STA-2903)
- 2026-11-27 → Implementing (review fixes: AC-002 the gate counts only a release whose run finished, and a contract
  step shipped with the migration it waits for is refused before any change; the gate settings are transaction-local;
  `stackra db migrate --release` in the CLI)
