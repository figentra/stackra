# Implementation Plan: drops, renames and backfills as expand and contract migration steps

**Spec**: `.agents/specs/sta-1406-expand-contract-migrations/spec.md` · **Linear**: STA-1406 · **Date**: 2026-11-26

**Input**: Feature specification from `.agents/specs/sta-1406-expand-contract-migrations/spec.md`

## Summary

Contract steps compile to a release gate first in their transaction, a `DO` block that reads the runner's ledger and
the version the run started from, so a destructive step can never run in the same release as the change that made it
safe. Renames get their expand half (a sync trigger for a column, a `security_invoker` view for a table), so two
releases run side by side during a rolling deploy. Checks, exclusions and index drops round out the DSL. The `Backfill`
kind fills the rows a contract step waits for, in resumable batches kept in a ledger, and `requireBackfill` is the
contract step's data gate.

## Technical Context

- **Language**: TypeScript (ESM)
- **Members**: `packages/data/database`, `packages/developer/gen`, `packages/developer/coding-standard`,
  `packages/developer/repo-checks`
- **Testing**: vitest unit tests in `src/**/__tests__/`, behaviour tests on PGlite (Postgres 17 in WASM, btree_gist
  contrib); squawk 2.71.0 over compiled samples with CI's flags
- **Storage**: Postgres; one new table `database.backfill_runs`
- **Runtime target**: `stackra db migrate` (production) and Encore's runner (dev, staging), both unchanged in shape

## Constitution Check

| Law                                   | Result | Note                                                             |
| ------------------------------------- | ------ | ---------------------------------------------------------------- |
| Boundaries (tier direction, ADR 0003) | PASS   | database stays below queue; gen and lint only gain table rows    |
| Secrets (ADR 0009)                    | PASS   | none read or written                                             |
| Security                              | PASS   | literal SQL fragments only, checked; error codes, never messages |
| HTTP and events                       | N/A    | no route, header or event changes                                |
| Tenancy                               | PASS   | platform ledger declared; rename views keep the invoker's RLS    |
| Delegation                            | PASS   | Claude only                                                      |
| Not built yet (ADR 0011)              | N/A    | none                                                             |
| Test placement (ADR 0022)             | PASS   | tests in `__tests__/` beside each subject                        |
| Versions and catalogs                 | PASS   | a minor changeset for the four packages                          |
| Deploy modes (ADR 0076)               | PASS   | same in all three                                                |
| Licence tier (ADR 0077)               | PASS   | free, MIT                                                        |
| Docs and ADRs                         | PASS   | README, AGENTS.md; implements ADR 0159 d3                        |

## Deploy modes

| Mode       | Behaviour                                                                                         |
| ---------- | ------------------------------------------------------------------------------------------------- |
| SaaS       | `stackra db migrate` sets the starting version; the gate holds every contract step to its release |
| On-prem    | the pre-upgrade migrate job does the same; an upgrade that skips a release is refused at the gate |
| Air-gapped | same as on-prem; nothing external is called                                                       |

## Correctness properties

- **P-001**: a contract step's gate is the first statement of its transaction, and its `after` is an edge — Validates:
  AC-001
- **P-002**: with the ledger and a starting version past `after`, the step applies; at or before it, or with `after`
  missing, it is refused and nothing changes — Validates: AC-002
- **P-003**: with no ledger, an unset setting or a starting version of 0, the gate passes — Validates: AC-003
- **P-004**: a row written through either name of a renamed column holds the same value in both — Validates: AC-004
- **P-005**: finishing a column rename is refused while any row is not copied, and drops the old column after —
  Validates: AC-005
- **P-006**: through the old table name an unprivileged role sees only its own rows and writes reach the renamed
  table — Validates: AC-006
- **P-007**: a check added to an existing table refuses a new bad row at once and its validation fails on an old one
  — Validates: AC-007
- **P-008**: an overlapping booking of one room is refused by the exclusion constraint — Validates: AC-007
- **P-009**: the compiled samples lint clean under squawk with CI's flags — Validates: AC-008
- **P-010**: a backfill run to the end fills every pending row; a `maxBatches` run hands back and the next one resumes;
  a failed batch leaves the cursor and records the SQLSTATE — Validates: AC-009
- **P-011**: `requireBackfill` refuses while a pending row exists and passes after — Validates: AC-010
- **P-012**: with `after` applied under release v2, a run of v2 (first or retried) and a run naming no release are
  refused and leave the version clean; a run of v3 applies the step; a forward-only run naming no release on a
  database with an applied file is refused before `after` applies, so the retry with v2 records `after` under v2 and
  its contract step is refused; on a fresh database such a run applies every file; a run applying the contract step
  with the migration it waits for is refused before that migration applies; while the run that applied it failed, a
  contract step is refused under every later release until a release holding it finishes its run; with v2 finished
  and v1 finishing again later, the v3 drop is refused until v2 finishes last; plain additive files apply with no
  release named, and the contract step after them waits for a named run holding them to finish; the refusal names
  `--release` and `STACKRA_RELEASE`, and `stackra db migrate` names the checkout's commit by default — Validates: AC-002
- **P-013**: as an owner role on a `FORCE` table with no tenant set, or a role without SELECT on the table, the data
  gate is refused naming the role and both causes and the old column keeps its values; a backfill fails with 42501, records it and is not finished — Validates: AC-012
- **P-014**: a rename whose new column has a default, a setting default, a generation or NOT NULL does not compile —
  Validates: AC-013

## Architecture overview

1. `Blueprint` and `SchemaBuilder` record each new step; `BlueprintRecord.compile` puts the contract gates first in the
   transactional step, then changes, added columns, the rename sync triggers, checks (`NOT VALID`), dropped checks,
   dropped columns and finished renames; dropped indexes are online steps before any built one, check validations
   after the index builds.
2. `SchemaRecord` compiles a table rename to the rename and its view, a finished rename or drop to the gate and the
   drop, and `requireBackfill` to `pendingRowsGateSql`; `contractAfter()` collects the `after` ids, which
   `compileMigration` appends to the declared edges.
3. `migrate` sets `stackra.migrate_from_version` (the version it started from) and `stackra.migrate_release`,
   outside `ROLLBACK_ENVIRONMENTS`, transaction-locally at the head of each transactional file (ADR 0495 decision 3).
   Before any change it refuses a pending contract step whose `after` is pending too (`contractAfterIds` reads the
   gate's `-- stackra:contract-after=<id>` line); after the last file it records a named run's release in
   `schema_migrations_releases` with the last file version it holds. `releaseGateSql` reads the newest ledger row of
   the `after` migration's files and passes only when another release holding it finished a run since.
4. `Backfill({ ... })` records a checked declaration; `runBackfill` drives a `BackfillSession`; `backfill` (node) opens
   one on the direct URL with the runner's timeouts.

## Components and responsibilities

- `releaseGateSql`, `pendingRowsGateSql`, `renameSyncSql`, `assertColumnType`: pure SQL builders and checks.
- `MIGRATION_ID_PATTERN`, `MIGRATE_FROM_VERSION_SETTING`, `MIGRATE_RELEASE_SETTING`, `ROLLBACK_ENVIRONMENTS`,
  `BACKFILL_LEDGER`: shared literals,
  so the compiler, the runner and the kind never disagree.
- `BackfillBase` and `Backfill`: the kind; `runBackfill`: batches, cursor, pause, progress, error code.
- `CreateBackfillRunsMigration` (`database.0009_create_backfill_runs`): the ledger.

## Files and folders

```text
packages/data/database/
  README.md
  AGENTS.md
  src/core/bases/backfill-base.base.ts
  src/core/bases/backfill.base.ts
  src/core/bases/__tests__/backfill.base.test.ts
  src/core/bases/migration.base.ts
  src/core/constants/backfill-ledger.constant.ts
  src/core/constants/contract-after-marker.constant.ts
  src/core/constants/migrate-from-version-setting.constant.ts
  src/core/constants/migrate-release-setting.constant.ts
  src/core/constants/migration-id-pattern.constant.ts
  src/core/functions/assert-column-type.function.ts
  src/core/functions/compile-migration.function.ts
  src/core/functions/constraint-name.function.ts
  src/core/functions/contract-after-file-pattern.function.ts
  src/core/functions/contract-after-ids.function.ts
  src/core/functions/pending-rows-gate-sql.function.ts
  src/core/functions/release-gate-sql.function.ts
  src/core/functions/rename-sync-sql.function.ts
  src/core/functions/run-backfill.function.ts
  src/core/functions/__tests__/compile-migration.function.test.ts
  src/core/functions/__tests__/contract-after-ids.function.test.ts
  src/core/functions/__tests__/release-gate-sql.function.test.ts
  src/core/functions/__tests__/run-backfill.function.test.ts
  src/core/records/blueprint.record.ts
  src/core/records/column-change.record.ts
  src/core/records/schema.record.ts
  src/core/records/__tests__/blueprint.record.test.ts
  src/core/records/__tests__/schema.record.test.ts
  src/core/types/backfill-batch.type.ts
  src/core/types/backfill-class.type.ts
  src/core/types/backfill-options.type.ts
  src/core/types/backfill-progress.type.ts
  src/core/types/backfill-query.type.ts
  src/core/types/backfill-session.type.ts
  src/core/types/blueprint.type.ts
  src/core/types/contract-options.type.ts
  src/core/types/dropped-index-options.type.ts
  src/core/types/exclusion-options.type.ts
  src/core/types/renamed-column-options.type.ts
  src/core/types/run-backfill-options.type.ts
  src/core/types/schema-builder.type.ts
  src/core/index.ts
  src/core/__tests__/index.test.ts
  src/node/commands/db-migrate.command.ts
  src/node/commands/__tests__/db-migrate.command.test.ts
  src/node/constants/rollback-environments.constant.ts
  src/node/database/migrations/0009-create-backfill-runs.migration.ts
  src/node/database/migrations/__tests__/0009-create-backfill-runs.migration.test.ts
  src/node/functions/backfill.function.ts
  src/node/functions/migrate.function.ts
  src/node/functions/open-migration-session.function.ts
  src/node/functions/rollback.function.ts
  src/node/functions/__tests__/migrate.function.test.ts
  src/node/functions/__tests__/migrate.function.int.test.ts
  src/node/functions/__tests__/backfill.function.int.test.ts
  src/node/index.ts
  src/node/__tests__/index.test.ts
  src/node/services/database-runner.service.ts
  src/testing/constants/platform-tables.constant.ts
packages/developer/console/
  src/core/functions/migration-release.function.ts
  src/core/functions/__tests__/migration-release.function.test.ts
  src/core/index.ts
  README.md
packages/developer/cli/
  src/node/commands/db-migrate.command.ts
  src/node/commands/__tests__/db-migrate.command.test.ts
  src/node/types/database-runner.type.ts
packages/developer/gen/src/core/constants/kind-files.constant.ts
packages/developer/gen/src/node/constants/kind-bases.constant.ts
packages/developer/coding-standard/src/core/constants/kind-bases.constant.ts
packages/developer/repo-checks/src/node/constants/module-groups.constant.ts
.changeset/expand-contract-migration-steps.md
.changeset/db-migrate-release-option.md
apps/docs/src/docs/standards/structure.mdx
```

## Data models and migrations

`database.backfill_runs` (migration `database.0009_create_backfill_runs`, a platform table): `key varchar(127)` primary
key, `last_key text`, `rows_done bigint default 0`, `batches integer default 0`, `finished_at timestamptz`,
`last_error varchar(63)`, `created_at`, `updated_at`. Every host's generated migrations gain this file once.

## Contracts

The additions listed under Impact. Existing calls compile to the same SQL, so released step checksums do not change; the
only shared change is `compileMigration`'s `after`, which now also lists contract-step ids (none exist before this
release).

## Error handling

- A refused gate raises `refused before any change: …` from its `DO` block; the transaction rolls back, and the runner
  reports the file and puts the version back clean, as for any failed file.
- A step the compiler can see is wrong throws `TypeError` naming the call (no `after`, a type the blueprint does not
  write, a fragment with `;` or `$$`, a drop beside another step on the same column, an exclusion on an existing
  table).
- A failed backfill batch rolls back with its cursor; the ledger records the SQLSTATE; the error is rethrown to the job.

## Security and tenancy

No new secret, route or event. SQL fragments are literals checked at declaration. The ledger is a platform table with no
tenant column; `last_error` holds a code only. The rename view is `security_invoker`, so a view never widens what a
role can read (tested with forced row-level security and an unprivileged role).

## Testing strategy

- AC-001, AC-008: `compile-migration.function.test.ts`, block "expand and contract steps, checks and exclusions
  (STA-1406)".
- AC-002, AC-003: `blueprint.record.test.ts` ("holds a dropped column to its release gate…"), `schema.record.test.ts`
  ("finishes a table rename…", "drops a table only past its release gate", "passes the release gate on a fresh
  database…"), `migrate.function.test.ts` (the two STA-1406 cases).
- AC-004, AC-005: `blueprint.record.test.ts` (rename tests). AC-006: `schema.record.test.ts` ("keeps a renamed table
  under its old name…"). AC-007: `blueprint.record.test.ts` (check and exclusion tests) and the compile tests.
- AC-009: `run-backfill.function.test.ts`, `backfill.base.test.ts`, `0009-create-backfill-runs.migration.test.ts`, and
  on real Postgres `backfill.function.int.test.ts`; the runner's gate end to end in `migrate.function.int.test.ts`.
  AC-010: `schema.record.test.ts` ("refuses a contract step while a backfill has rows to reach…").
- AC-011: the gen, coding-standard and repo-checks suites.
- Revert checks: each behaviour's test fails with its line reverted (security_invoker, the gate condition, the sync
  trigger, the gate placement, the runner's setting, the cursor move, the edge merge, `NOT VALID`).

## Rollout

- A minor changeset for the four packages. Hosts pick up migration 0009 on their next `stackra gen`.
- The gate is new behaviour only for new contract steps; no released migration compiles differently.
- To roll back, revert the release; the ledger table stays (a later migration can drop it).

## Known risks

- The gate counts a release as serving once its `stackra db migrate` run finished; a deploy that fails after the
  migrate step (the app rollout itself) is not seen. Give each deploy its own release id, and run migrate once per
  release.
- A backfill walks rows the migrating role can see. On a table with forced row-level security the role must bypass it
  (as `refuseNulls` already assumes).
- Validator-derived CHECK constraints are not built here; they stay on STA-1406.

## Delegation and risk plan

Claude only; one wave; route `spec-task`. R2: the change waits for the CTO's approval stop before it merges.
