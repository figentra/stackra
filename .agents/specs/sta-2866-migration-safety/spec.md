# Feature Specification: gen classifies migration safety and runway fills destructive in the deploy evidence

**Feature Branch**: `figentra/sta-2866-migration-safety`

**Created**: 2026-11-26

**Status**: Implementing <!-- Draft → Clarified → Planned → Tasked → Implementing → Done, or Abandoned / Superseded (OR12). spec-gate refuses a status ahead of its artifacts; append every change to Status history -->

**Tier**: feature

**Approver**: leader

**Linear**: STA-2866

**Linear project**: none

**Clarifications status**: complete

**Analyze**: —

**Input**: ADR 0159's 2026-10-23 note sorts every migration operation into one of four classes, Additive, Online,
Contract and Banned, and says gen enforces the class of each step. Gen computes none of them. As a result
`runway evidence` always writes `destructive: null`, which floors every production deploy that carries migrations
(ADR 0533 decision 3, "deleting accounts, data or databases (destructive migrations included)", evidence "gen's
migration classification"). It also cannot name which migrations are destructive.

### Sources

- `packages/developer/runway/src/core/functions/deploy-evidence.function.ts` on `origin/main` (`destructive: null`
  with the shortcut comment "gen does not classify migrations yet")
- `packages/developer/gen/src/node/functions/compile-migrations.function.ts`,
  `packages/developer/gen/src/core/functions/emit-migrations.function.ts`,
  `packages/developer/gen/src/node/functions/generate.function.ts`
- ADR 0159 (decision 3; the 2026-10-23 note: Additive, Online, Contract, Banned; decision 4: forward fix only), ADR 0334
  rule 4 (no data change in a migration), ADR 0533 decision 3 (the floor row for destructive migrations)
- FR-001 to FR-010: the PR's diff against `main` and its tests (FR-009 and FR-010 from the review fixes)

## Impact _(mandatory, answer every line before /flow-clarify completes)_

- **Apps touched**: `apps/docs` (the `runway evidence` page)
- **Services touched**: none (every service with migrations gets the new generated file on its next `stackra gen`)
- **Packages touched**: `packages/developer/gen` (classifier, statement splitter, safety file, `migration_banned`
  refusal, new exports), `packages/developer/runway` (`deployEvidence`, `runway evidence` and its `--previous` option,
  the new `runway migrations:record` command and its `runway-migrations` record)
- **Public contract change**: additive. `@stackra/gen` exports `classifyMigrationStatement`, `classifyMigrations`,
  `emitMigrationSafety`, `MIGRATION_SAFETY_FILE` and the types `MigrationSafety`, `MigrationSafetyRow`,
  `MigrationSafetyFinding` and `MigrationSafetyClass`. `compileMigrations` also returns `safety`. Gen writes a new file,
  `.stackra/migration-safety.json` (`stackra.migration-safety/v1`) for every service. `runway evidence` gains
  `--previous <file>`. `@stackra/runway` gains the `runway migrations:record` command (`RunwayMigrationsRecordCommand`,
  in its manifest), which writes `runway-migrations-<environment>[-<member>].json` (`runway.migrations/v1`) after a
  successful deploy. The `runway.evidence/v1` shape is unchanged: only the values of `destructive` and
  `destructiveMigrations` are now filled. Behaviour change: gen refuses a new migration that holds a banned statement
  (`migration_banned`).
- **Cross-service events**: none
- **Tenancy and data**: none at run time. The classifier reads compiled SQL text only. It never connects to a database.
- **Security and privacy**: no personal data. The safety file and the evidence carry migration ids, classes, reasons
  and SQL excerpts of the schema only. No values, no secrets.
- **Secrets**: none
- **ADR needed**: no (implements ADR 0159's 2026-10-23 note and ADR 0533 decision 3 as written)
- **New dependencies**: none (`zod` is already a dependency of `@stackra/runway`)
- **Deploy modes**: same in all three
- **Licence tier**: free (MIT, this repo)
- **UI surfaces**: none
- **Docs to update**: `packages/developer/gen/README.md` (the generated files table and the refusals),
  `packages/developer/runway/README.md` (the command table), `apps/docs/src/docs/runway/evidence.mdx`,
  `apps/docs/src/docs/runway/migrations-record.mdx` (new, with its `docs.config.ts` entry), a minor changeset for
  `@stackra/gen` and `@stackra/runway`
- **Lane**: full (new gen refusal, new public exports and a new generated file, and the approvals evidence changes)
- **Change risk**: R2 (gen refuses a class of migration it accepted before; the approvals bot gets real `destructive`
  values)

## Glossary _(full lane)_

- **Class**: the ADR 0159 class of a compiled statement. `additive` adds or relaxes something (a new table, column or
  object, a nullable or defaulted column, a NOT VALID constraint, a dropped constraint or default, a comment, a grant).
  `online` runs without blocking writes (a concurrent index build or drop, an index drop, a constraint validation, a
  concurrent reindex or refresh). `contract` removes or narrows what the running release uses (a dropped table, column,
  function, policy or trigger, a rename, `SET NOT NULL`, a type change, a NOT NULL column without a default, a
  constraint checked under a lock). `banned` never belongs in a migration (a data write, an index built on an existing
  table without `CONCURRENTLY`, a lock, a vacuum, a table rewrite).
- **Destructive**: a migration whose class is `contract` or `banned`.
- **Released banned migration**: one of the ten migrations already released that hold a banned statement
  (`RELEASED_BANNED_MIGRATIONS`). They are frozen (ADR 0159 decision 4), so gen keeps compiling them, classed `banned`.
- **Stream**: one service's compiled migrations as a deploy ships them: its safety file and its `.stackra/migrations`
  step files.
- **Previous keys**: the `<member>:<id>` keys the last successful deploy to the same environment applied, from the
  `runway-migrations` record `runway migrations:record` wrote after it.

## User Scenarios & Testing _(mandatory)_

### User Story 1 - A destructive migration goes to the owner, a safe one does not (Priority: P1)

A team deploys a service to production. When the deploy carries a new migration that drops a column, the approvals bot
sees `destructive: true` with the migration's id and waits for the owner. When the deploy carries only additive or
online migrations, the bot sees `destructive: false` and nothing about migrations holds it back.

**Why this priority**: today every deploy that carries migrations is floored, and the owner cannot see which migration
is the risk.

**Independent Test**: `runway evidence` in a temporary repository with a service's safety file, compiled files and a
`--previous` file.

**Acceptance Scenarios**:

1. **Given** a service whose second migration drops a column and a `--previous` file with only the first, **When**
   `runway evidence production --target encore-cloud` runs, **Then** the evidence says `destructive: true` and
   `destructiveMigrations: ["billing.0002_drop_note"]`.
2. **Given** the `runway-migrations` record `runway migrations:record` wrote after that deploy succeeded, as
   `--previous`, **When** the next deploy runs, **Then** the evidence says `destructive: false`.
3. **Given** no `--previous`, **When** a stream holds a destructive migration, **Then** `destructive` is `null`.

---

### User Story 2 - Gen refuses a banned statement (Priority: P1)

A developer writes a migration that backfills rows with `update`. `stackra gen` refuses it with `migration_banned`,
names the migration, step and statement, and says to move the backfill to a queue job.

**Why this priority**: ADR 0159 and ADR 0334 already ban this; nothing enforced it.

**Independent Test**: `compileMigrations` on a hermetic host whose package migration runs `update`.

**Acceptance Scenarios**:

1. **Given** a migration with `update ai.agents set note = 1`, **When** gen compiles, **Then** it refuses with
   `migration_banned` and writes no file.
2. **Given** a released banned migration (`outbox.0006_contract_outbox_tenancy`), **When** gen compiles a host of it,
   **Then** gen accepts it and classes it `banned` and destructive.

---

### User Story 3 - The evidence never claims safety it cannot prove (Priority: P1)

**Acceptance Scenarios**:

1. **Given** a safety file that does not list a compiled step file (stale), **When** `runway evidence` runs, **Then**
   `destructive` is `null`; **When** `runway migrations:record` runs, **Then** it writes no record.
2. **Given** a fresh checkout where gen has not run (no `.stackra/`, which is gitignored) and a service with migration
   sources, **When** `runway evidence` runs, **Then** `destructive` is `null`, never `false`.
3. **Given** a deploy the owner rejected or that failed, **Then** no `runway-migrations` record exists for it, so the
   next deploy's evidence still counts its destructive migrations as new.
4. **Given** a Workers member whose `wrangler.jsonc` has Durable Object migrations or a D1 binding, **When** the
   evidence is written, **Then** `destructive` is `null`.
5. **Given** a client target (`eas`, `mintlify`, `npm`, `electron-release`), **Then** `destructive` is `false`.

---

### Edge Cases

- **EC-01**: A statement on a table created earlier in the same migration with a plain `CREATE TABLE` is `additive`:
  no release reads that table yet. `CREATE TABLE IF NOT EXISTS` may adopt a table already in use, so it marks nothing
  created (`database.0005_create_cache_tables` is therefore classed `banned` and joins the released set).
- **EC-02**: Comment lines, string literals and dollar-quoted bodies never change the class. A function body that
  writes rows is the function's, not the migration's.
- **EC-03**: A `DO` block is judged by its body. Only reads and raises are `additive`, a data write is `banned` and
  anything else is `contract`. `FOR UPDATE` locks rows and writes nothing.
- **EC-04**: A statement gen cannot read is `contract`, so an unknown is destructive and never safe. A raw string with
  several top-level statements is split on its semicolons (outside literals, quoted identifiers, dollar-quoted bodies
  and comments) and each part is classed alone; `classifyMigrationStatement` given such a string returns `contract`.
- **EC-05**: A key is per member, so the same migration id shipped by another service does not count as shipped.
- **EC-06**: A `true` is reported even beside an unknown stream, since it is floor either way.
- **EC-07**: A `--previous` file of another environment, or one that does not parse, is refused with exit 2 before
  anything is written.
- **EC-08**: A service with no migration gets a safety file with no rows. A leftover one that still lists migrations
  that are gone is reported by `--check` and rewritten by a write run. A missing safety file always means gen has not
  run, so the stream is unknown (`null`), never "no migrations".
- **EC-09**: A service target in a repository with no service folder is `null`.

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: THE `@stackra/gen` `classifyMigrationStatement` SHALL return the ADR 0159 class and a one-line reason of
  one compiled statement, as the Glossary defines the classes, with EC-01 to EC-04.
- **FR-002**: THE `classifyMigrations` function SHALL class each ordered migration by the highest class of its
  statements. It SHALL mark `contract` and `banned` as destructive, record the step file names `emitMigrations` writes,
  and list every statement above `additive` with its step, position, class, reason and SQL excerpt.
- **FR-003**: IF a migration holds a `banned` statement and is not in `RELEASED_BANNED_MIGRATIONS` THEN gen SHALL refuse
  it with `migration_banned`, naming the migration, step and statement, and write no migration file.
- **FR-004**: Gen SHALL write `.stackra/migration-safety.json` (`stackra.migration-safety/v1`) for every service, with
  no rows when it has no migration, so a missing file means gen has not run.
- **FR-005**: FOR a service target (`encore-cloud`, `aws-ecs`, `compose`, `helm`), `deployEvidence` SHALL set
  `destructive` to `true` with the ids when a destructive migration is missing from the previous keys. It SHALL set
  `false` when every stream is current and nothing destructive is new, or no stream has one. It SHALL set `null`
  otherwise.
- **FR-006**: FOR a client target `destructive` SHALL be `false`. FOR a Workers member it SHALL be `false` only when
  its read config has neither `migrations` nor `d1_databases`. FOR an undeclared target it SHALL be `null`.
- **FR-007**: THE `runway evidence` command SHALL read each shipped service's safety file and compiled file names and
  SHALL take `--previous <file>`. It SHALL NOT write a `runway-migrations` record, since it runs before the deploy.
  A stream with no safety file SHALL be unknown.
- **FR-009**: THE `runway migrations:record` command, run after a deploy step succeeded, SHALL write
  `runway-migrations-<environment>[-<member>].json` with the keys of the shipped migrations when every stream is
  current, and write nothing (with a warning) otherwise. It SHALL refuse with exit 2 a non-service target or a short
  sha.
- **FR-010**: `classifyMigrations` SHALL class each top-level statement of a compiled string alone
  (`splitSqlStatements`).
- **FR-008**: THE `runway evidence` command SHALL refuse with exit 2 a `--previous` file that does not parse or names
  another environment.

## Acceptance criteria _(mandatory for a tiered spec, ADR 0502)_

- **AC-001**: WHEN a deploy carries a destructive migration the previous deploy did not ship THE evidence SHALL say
  `destructive: true` and list its id.
- **AC-002**: WHEN every carried migration is additive or online THE evidence SHALL say `destructive: false`.
- **AC-003**: IF the classes are missing or stale, or no previous keys exist for a stream with a destructive migration, THEN THE evidence SHALL say `destructive: null`.
- **AC-004**: WHEN a new migration writes data or builds an index on an existing table without `CONCURRENTLY` THE gen run SHALL refuse it with `migration_banned`.
- **AC-005**: WHEN a host ships one of the released banned migrations THE gen run SHALL still compile it, classed
  `banned`.
- **AC-006**: THE classifier SHALL class every statement of the repository's 98 package migrations without an error.
- **AC-007**: WHEN gen has not run in the checkout THE evidence SHALL say `destructive: null` for a service target.
- **AC-008**: WHEN a deploy was rejected or failed THE next deploy's `--previous` record SHALL NOT include its
  migrations (only `runway migrations:record` after a successful deploy writes one).
- **AC-009**: WHEN a compiled `schema.sql()` string holds a destructive statement after a harmless one THE gen run SHALL class the migration destructive and name that statement in its own finding.

## Success Criteria _(mandatory)_

- **SC-001**: `classify-migration-statement.function.test.ts`, `classify-migrations.function.test.ts`,
  `emit-migration-safety.function.test.ts`, `split-sql-statements.function.test.ts`,
  `compile-migrations.function.test.ts` and `generate.function.test.ts` prove FR-001 to FR-004 and FR-010, and fail
  when the change is reverted — verified by: unit
- **SC-002**: `destructive-of.function.test.ts`, `stream-is-current.function.test.ts`,
  `migration-keys-of.function.test.ts`, `deploy-evidence.function.test.ts`, `runway-evidence.command.test.ts` and
  `runway-migrations-record.command.test.ts` prove FR-005 to FR-009, and fail when the change is reverted — verified
  by: unit
- **SC-003**: `pnpm gen` over the whole workspace passes with the classifier on, and every package migration is
  classed (59 additive, 15 online, 14 contract, 10 banned released) — verified by: manual (box 2)
- **SC-004**: the gen and runway tests, typecheck, oxlint and oxfmt pass — verified by: manual

## Compatibility and migration

- Hosts need no code change. The next `stackra gen` writes the safety file.
- A host whose own migration holds a banned statement that gen accepted before is now refused. If it is already
  applied, the host rewrites it as a new expand and contract migration. A released migration cannot be edited
  (decision 4), so the host asks for an exception, which ships as a Stackra release.
- A deploy workflow that wants `destructive` to be `false` or `true` rather than `null` runs `stackra gen` in the
  evidence job before `runway evidence`, runs `runway migrations:record` in the deploy job after the deploy step
  succeeded, uploads that record as an artifact, and passes the record of the environment's last successful deploy
  run as `--previous` to the next deploy to the same environment.
- A Workers member with a clean config now reports `destructive: false` (it was `null`).

## Risks

- **R-1**: The classifier reads SQL text with patterns, not a parser. An unusual statement may get a stricter class
  than it deserves. Every unknown is `contract`, a multi-statement string is split and each part classed, and a
  missing safety file is `null`, so the failure mode is floor, never a wrong auto-approval.
- **R-2**: Without `--previous`, a service that once shipped a destructive migration stays `null` on every deploy.
  The workflow wiring (gen in the evidence job, `migrations:record` after the deploy step, the artifact of the last
  successful run as `--previous`) is a follow-up in the template's deploy workflows. A workflow that took a record
  from a run whose deploy did not succeed could make a destructive migration look old; only `migrations:record`
  after a successful deploy step writes one, and the docs say to take the last successful run's.
- **R-3**: Package migrations shipped from the registry change only with a package release. A new banned statement
  in a package fails that package's own gen run before it is published.

## Out of scope

- Wiring `stackra gen`, `--previous` and `runway migrations:record` into the template's deploy workflows (no
  workflow calls `runway evidence` yet).
- Classifying Durable Object migrations (`deleted_classes`) and D1 migrations. Both stay `null`.
- A squawk lint run in CI (ADR 0159 decision 3, separate).

## Assumptions

- `.stackra/` is gitignored. Where `stackra gen` has not run before `runway evidence`, every service target is
  `null` (floor), never `false`.
- The migrations released on `main` before this change are the ones applied somewhere, so they are frozen.

## Open questions

None.

## Amendments

- 2026-11-26 · review fixes (Claude, STA-2866 session): a missing safety file is unknown and gen writes an empty one
  for every service; each top-level statement of a raw string is classed alone; `CREATE TABLE IF NOT EXISTS` marks
  nothing created, so `database.0005_create_cache_tables` joins the released banned set; `runway evidence` no longer
  writes the `runway-migrations` record and the new `runway migrations:record` writes it after a successful deploy
  (FR-004 and FR-007 changed, FR-009, FR-010, AC-007, AC-008, AC-009, EC-09 added).

## Status history

- 2026-11-26 · — → Draft · Claude (STA-2866 session) · created from the PR diff
- 2026-11-26 · Draft → Clarified · Claude (STA-2866 session) · clarifications complete
- 2026-11-26 · Clarified → Planned · Claude (STA-2866 session) · plan.md
- 2026-11-26 · Planned → Tasked · Claude (STA-2866 session) · tasks.md
- 2026-11-26 · Tasked → Implementing · Claude (STA-2866 session) · T001 to T010 committed on the branch
