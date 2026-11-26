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
- FR-001 to FR-008: the PR's diff against `main` and its tests

## Impact _(mandatory, answer every line before /flow-clarify completes)_

- **Apps touched**: `apps/docs` (the `runway evidence` page)
- **Services touched**: none (every service with migrations gets the new generated file on its next `stackra gen`)
- **Packages touched**: `packages/developer/gen` (classifier, safety file, `migration_banned` refusal, new exports),
  `packages/developer/runway` (`deployEvidence`, `runway evidence`, the `--previous` option and the
  `runway-migrations` file)
- **Public contract change**: additive. `@stackra/gen` exports `classifyMigrationStatement`, `classifyMigrations`,
  `emitMigrationSafety`, `MIGRATION_SAFETY_FILE` and the types `MigrationSafety`, `MigrationSafetyRow`,
  `MigrationSafetyFinding` and `MigrationSafetyClass`. `compileMigrations` also returns `safety`. Gen writes a new file,
  `.stackra/migration-safety.json` (`stackra.migration-safety/v1`). `runway evidence` gains `--previous <file>` and
  writes `runway-migrations-<environment>[-<member>].json` (`runway.migrations/v1`). The `runway.evidence/v1` shape is
  unchanged: only the values of `destructive` and `destructiveMigrations` are now filled. Behaviour change: gen refuses
  a new migration that holds a banned statement (`migration_banned`).
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
  `apps/docs/src/docs/runway/evidence.mdx`, a minor changeset for `@stackra/gen` and `@stackra/runway`
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
- **Released banned migration**: one of the nine migrations already released that hold a banned statement
  (`RELEASED_BANNED_MIGRATIONS`). They are frozen (ADR 0159 decision 4), so gen keeps compiling them, classed `banned`.
- **Stream**: one service's compiled migrations as a deploy ships them: its safety file and its `.stackra/migrations`
  step files.
- **Previous keys**: the `<member>:<id>` keys the last deploy to the same environment shipped, from its
  `runway-migrations` file.

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
2. **Given** the `runway-migrations` file of that deploy as `--previous`, **When** the next deploy runs, **Then** the
   evidence says `destructive: false`.
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
   `destructive` is `null` and no `runway-migrations` file is written.
2. **Given** a Workers member whose `wrangler.jsonc` has Durable Object migrations or a D1 binding, **When** the
   evidence is written, **Then** `destructive` is `null`.
3. **Given** a client target (`eas`, `mintlify`, `npm`, `electron-release`), **Then** `destructive` is `false`.

---

### Edge Cases

- **EC-01**: A statement on a table created earlier in the same migration is `additive`: no release reads that table
  yet.
- **EC-02**: Comment lines, string literals and dollar-quoted bodies never change the class. A function body that
  writes rows is the function's, not the migration's.
- **EC-03**: A `DO` block is judged by its body. Only reads and raises are `additive`, a data write is `banned` and
  anything else is `contract`. `FOR UPDATE` locks rows and writes nothing.
- **EC-04**: A statement gen cannot read is `contract`, so an unknown is destructive and never safe.
- **EC-05**: A key is per member, so the same migration id shipped by another service does not count as shipped.
- **EC-06**: A `true` is reported even beside an unknown stream, since it is floor either way.
- **EC-07**: A `--previous` file of another environment, or one that does not parse, is refused with exit 2 before
  anything is written.
- **EC-08**: A leftover `.stackra/migration-safety.json` of a service with no migrations left is reported by
  `--check` and removed by a write run.

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: THE `@stackra/gen` `classifyMigrationStatement` SHALL return the ADR 0159 class and a one-line reason of
  one compiled statement, as the Glossary defines the classes, with EC-01 to EC-04.
- **FR-002**: THE `classifyMigrations` function SHALL class each ordered migration by the highest class of its
  statements. It SHALL mark `contract` and `banned` as destructive, record the step file names `emitMigrations` writes,
  and list every statement above `additive` with its step, position, class, reason and SQL excerpt.
- **FR-003**: IF a migration holds a `banned` statement and is not in `RELEASED_BANNED_MIGRATIONS` THEN gen SHALL refuse
  it with `migration_banned`, naming the migration, step and statement, and write no migration file.
- **FR-004**: WHEN a service has compiled migrations, gen SHALL write `.stackra/migration-safety.json`
  (`stackra.migration-safety/v1`). Gen SHALL remove a leftover one (reported by `--check`).
- **FR-005**: FOR a service target (`encore-cloud`, `aws-ecs`, `compose`, `helm`), `deployEvidence` SHALL set
  `destructive` to `true` with the ids when a destructive migration is missing from the previous keys. It SHALL set
  `false` when every stream is current and nothing destructive is new, or no stream has one. It SHALL set `null`
  otherwise.
- **FR-006**: FOR a client target `destructive` SHALL be `false`. FOR a Workers member it SHALL be `false` only when
  its read config has neither `migrations` nor `d1_databases`. FOR an undeclared target it SHALL be `null`.
- **FR-007**: THE `runway evidence` command SHALL read each shipped service's safety file and compiled file names. It
  SHALL take `--previous <file>`, and for a service target whose streams are all current it SHALL write
  `runway-migrations-<environment>[-<member>].json` with the shipped keys.
- **FR-008**: THE `runway evidence` command SHALL refuse with exit 2 a `--previous` file that does not parse or names
  another environment.

## Acceptance criteria _(mandatory for a tiered spec, ADR 0502)_

- **AC-001**: WHEN a deploy carries a destructive migration the previous deploy did not ship THE evidence SHALL say
  `destructive: true` and list its id.
- **AC-002**: WHEN every carried migration is additive or online THE evidence SHALL say `destructive: false`.
- **AC-003**: IF the classes are missing or stale, or no previous keys exist for a stream with a destructive migration,
  THEN THE evidence SHALL say `destructive: null`.
- **AC-004**: WHEN a new migration writes data or builds an index on an existing table without `CONCURRENTLY` THE gen
  run SHALL refuse it with `migration_banned`.
- **AC-005**: WHEN a host ships one of the released banned migrations THE gen run SHALL still compile it, classed
  `banned`.
- **AC-006**: THE classifier SHALL class every statement of the repository's 98 package migrations without an error.

## Success Criteria _(mandatory)_

- **SC-001**: `classify-migration-statement.function.test.ts`, `classify-migrations.function.test.ts`,
  `emit-migration-safety.function.test.ts`, `compile-migrations.function.test.ts` and `generate.function.test.ts` prove
  FR-001 to FR-004, and fail when the change is reverted — verified by: unit
- **SC-002**: `destructive-of.function.test.ts`, `stream-is-current.function.test.ts`,
  `migration-keys-of.function.test.ts`, `deploy-evidence.function.test.ts` and `runway-evidence.command.test.ts` prove
  FR-005 to FR-008, and fail when the change is reverted — verified by: unit
- **SC-003**: `pnpm gen` over the whole workspace passes with the classifier on, and every package migration is
  classed (60 additive, 15 online, 14 contract, 9 banned released) — verified by: manual (box 2)
- **SC-004**: the gen and runway tests, typecheck, oxlint and oxfmt pass — verified by: manual

## Compatibility and migration

- Hosts need no code change. The next `stackra gen` writes the safety file.
- A host whose own migration holds a banned statement that gen accepted before is now refused. If it is already
  applied, the host rewrites it as a new expand and contract migration. A released migration cannot be edited
  (decision 4), so the host asks for an exception, which ships as a Stackra release.
- A deploy workflow that wants `destructive` to be `false` or `true` rather than `null` keeps the `runway-migrations`
  artifact and passes it as `--previous` to the next deploy to the same environment.
- A Workers member with a clean config now reports `destructive: false` (it was `null`).

## Risks

- **R-1**: The classifier reads SQL text with patterns, not a parser. An unusual statement may get a stricter class
  than it deserves. Every unknown is `contract`, so the failure mode is floor, never a wrong auto-approval.
- **R-2**: Without `--previous`, a service that once shipped a destructive migration stays `null` on every deploy.
  The workflow wiring that keeps the artifact is a follow-up in the deploy workflows.
- **R-3**: Package migrations shipped from the registry change only with a package release. A new banned statement
  in a package fails that package's own gen run before it is published.

## Out of scope

- Wiring `--previous` into the template's deploy workflows (no workflow calls `runway evidence` yet).
- Classifying Durable Object migrations (`deleted_classes`) and D1 migrations. Both stay `null`.
- A squawk lint run in CI (ADR 0159 decision 3, separate).

## Assumptions

- `.stackra/` is rebuilt by `stackra gen` before a deploy job runs `runway evidence`, as the deploy builds already do.
- The migrations released on `main` before this change are the ones applied somewhere, so they are frozen.

## Open questions

None.

## Amendments

None.

## Status history

- 2026-11-26 · — → Draft · Claude (STA-2866 session) · created from the PR diff
- 2026-11-26 · Draft → Clarified · Claude (STA-2866 session) · clarifications complete
- 2026-11-26 · Clarified → Planned · Claude (STA-2866 session) · plan.md
- 2026-11-26 · Planned → Tasked · Claude (STA-2866 session) · tasks.md
- 2026-11-26 · Tasked → Implementing · Claude (STA-2866 session) · T001 to T010 committed on the branch
