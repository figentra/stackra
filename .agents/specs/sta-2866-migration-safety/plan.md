# Implementation Plan: gen classifies migration safety and runway fills destructive in the deploy evidence

**Spec**: `.agents/specs/sta-2866-migration-safety/spec.md` · **Linear**: STA-2866 · **Date**: 2026-11-26

**Input**: Feature specification from `.agents/specs/sta-2866-migration-safety/spec.md`

## Summary

Gen gains a pure classifier, `classifyMigrationStatement`. It folds a compiled statement (`sqlCodeOf`: drops every comment,
blanks literals and dollar-quoted bodies, masks quoted identifiers) and matches it to an ADR 0159 class. `classifyMigrations` runs it over the ordered
units after `orderMigrations`. It tracks the tables each migration creates, takes the highest class per migration,
records the step file names (`migrationStepNames`, now shared with `emitMigrations`) and refuses a banned statement
outside `RELEASED_BANNED_MIGRATIONS`. `compileMigrations` returns the document, and `generate` writes it to
`.stackra/migration-safety.json` for a service and sweeps a leftover one. Runway reads that file through
`MIGRATION_SAFETY_FILE_SCHEMA`. `deployEvidence` judges `destructive` per target, and `destructiveOf` compares the
streams with the previous deploy's keys. The command writes those keys for the next deploy.

## Technical Context

- **Language**: TypeScript (ESM), Node 24
- **Members**: `packages/developer/gen` (`@stackra/gen`), `packages/developer/runway` (`@stackra/runway`), `apps/docs`
- **Testing**: vitest in `src/**/__tests__/` (ADR 0022); hermetic temp hosts for `compileMigrations` and the command
- **Storage**: none
- **Runtime target**: the classifier and evidence functions are isomorphic; `compileMigrations`, `generate` and the
  command are node

## Constitution Check

| Law                                   | Result | Note                                                                             |
| ------------------------------------- | ------ | -------------------------------------------------------------------------------- |
| Boundaries (tier direction, ADR 0003) | PASS   | gen and runway share a JSON file contract; neither imports the other             |
| Secrets (ADR 0009)                    | N/A    | no secret is read or named                                                       |
| Security                              | PASS   | schema SQL excerpts only; unknowns are floor                                     |
| HTTP and events                       | N/A    | no route, header or event changes                                                |
| Tenancy                               | N/A    | no tenant data                                                                   |
| Delegation                            | PASS   | one session, one branch                                                          |
| Not built yet (ADR 0011)              | PASS   | nothing from the table                                                           |
| Test placement (ADR 0022)             | PASS   | tests sit in `__tests__/` beside each changed file                               |
| Versions and catalogs                 | PASS   | no dependency added                                                              |
| Deploy modes (ADR 0076)               | PASS   | same in all three                                                                |
| Licence tier (ADR 0077)               | PASS   | free                                                                             |
| Docs and ADRs                         | PASS   | gen README, the `runway evidence` page and a changeset; implements ADR 0159/0533 |

## Deploy modes

| Mode       | Behaviour                                                                                      |
| ---------- | ---------------------------------------------------------------------------------------------- |
| SaaS       | the deploy job runs `runway evidence` with `--previous`; the bot floors only a new destructive |
| On-prem    | same file contract; the upgrade job can read `.stackra/migration-safety.json` too              |
| Air-gapped | same                                                                                           |

## Correctness properties

- **P-001**: for every statement, the class is one of the four, and a statement gen cannot read is `contract` — Validates: FR-001
- **P-002**: for every migration, its class is the maximum of its statements' classes and `destructive` holds exactly for `contract` and `banned` — Validates: FR-002
- **P-003**: the safety file's step names equal the `.up.sql` names `emitMigrations` writes, in order, and every service gets one (no rows when it has no migration) — Validates: FR-002, FR-004
- **P-004**: a banned statement outside the released set always yields `migration_banned` and no files — Validates: FR-003
- **P-005**: `destructiveOf` never returns `false` while a stream has no safety file, is not current, or holds a destructive migration that lacks a baseline — Validates: FR-005, FR-006
- **P-006**: `migrationKeysOf` returns keys only when every stream is current, and `runway evidence` reads a stream with no safety file as unknown — Validates: FR-007
- **P-007**: a `--previous` record that does not parse or names another environment is refused with exit 2 — Validates: FR-008
- **P-008**: `runway migrations:record` writes a record only when every stream is current, and refuses a non-service target or a short sha with exit 2 — Validates: FR-009
- **P-009**: for every compiled string, the class of the migration is the maximum over its top-level statements (`splitSqlStatements`), and a semicolon inside a literal, a quoted identifier, a dollar-quoted body or a comment never splits — Validates: FR-010

## Architecture overview

```text
compileMigrations ── orderMigrations ── classifyMigrations ──► { files, safety, errors(migration_banned) }
                                             │ classifyMigrationStatement (per statement, created tables)
                                             │ splitSqlStatements (each top-level statement of a string alone)
generate ── writes .stackra/migrations/*.sql + .stackra/migration-safety.json (every service, empty when no migration)
runway evidence ── readMigrationStreams(services/<m>/.stackra/{migration-safety.json, migrations/})
                └─ destructiveOf(streams, --previous) ── writes runway-evidence-<env>.json
runway migrations:record (after the deploy step succeeded) ── readMigrationStreams ── migrationKeysOf
                └─ writes runway-migrations-<env>.json, the next deploy's --previous
```

## Components and responsibilities

- `classifyMigrationStatement` (gen core): one statement to a class and a reason, plus the table it creates.
- `migrationSafetyRank` (gen core): the class order.
- `splitSqlStatements` (gen core): the top-level statements of one compiled string.
- `classifyMigrations` (gen core): the per-migration classes, findings, step names and refusals.
- `migrationStepNames` (gen core): the step file names, shared by `emitMigrations`.
- `emitMigrationSafety` and `MIGRATION_SAFETY_FILE` (gen core): the generated file.
- `RELEASED_BANNED_MIGRATIONS` (gen core): the ten frozen released ids.
- `compileMigrations` and `generate` (gen node): return and write the document for every service.
- `MIGRATION_SAFETY_FILE_SCHEMA` (runway core): what runway reads of the file.
- `SERVICE_TARGETS` (runway core): the targets that ship services, shared by the function and the command.
- `streamIsCurrent`, `destructiveOf`, `migrationKeysOf` (runway core): the judgement and the shipped keys.
- `deployEvidence` (runway core): `destructive` per target.
- `readMigrationStreams` (runway node): the streams of the services one job ships.
- `RunwayEvidenceCommand` (runway node): reads the streams and `--previous`, writes the evidence.
- `RUNWAY_MIGRATIONS_FILE_SCHEMA` (runway core) and `RunwayMigrationsRecordCommand` (runway node): the record a successful deploy writes.

## Files and folders

```text
packages/developer/gen/
├── README.md
├── __golden__/<fixture>/expected/services/<member>/.stackra/migration-safety.json.golden
└── src/
    ├── core/
    │   ├── index.ts
    │   ├── constants/
    │   │   ├── migration-safety-file.constant.ts
    │   │   └── released-banned-migrations.constant.ts
    │   ├── functions/
    │   │   ├── classify-migration-statement.function.ts
    │   │   ├── classify-migrations.function.ts
    │   │   ├── emit-migration-safety.function.ts
    │   │   ├── emit-migrations.function.ts
    │   │   ├── migration-safety-rank.function.ts
    │   │   ├── migration-step-names.function.ts
    │   │   ├── skip-sql-quoted.function.ts
    │   │   ├── split-sql-statements.function.ts
    │   │   ├── sql-code-of.function.ts
    │   │   └── __tests__/
    │   └── types/
    │       ├── classified-statement.type.ts
    │       ├── migration-safety-class.type.ts
    │       ├── migration-safety-finding.type.ts
    │       ├── migration-safety-row.type.ts
    │       └── migration-safety.type.ts
    └── node/functions/
        ├── compile-migrations.function.ts
        ├── generate.function.ts
        └── __tests__/
packages/developer/runway/
├── README.md
├── stackra.manifest.json
└── src/
    ├── core/
    │   ├── constants/
    │   │   ├── migration-safety-file-schema.constant.ts
    │   │   ├── runway-migrations-file-schema.constant.ts
    │   │   └── service-targets.constant.ts
    │   ├── functions/
    │   │   ├── deploy-evidence.function.ts
    │   │   ├── destructive-of.function.ts
    │   │   ├── migration-keys-of.function.ts
    │   │   ├── stream-is-current.function.ts
    │   │   └── __tests__/
    │   └── types/
    │       ├── deploy-evidence.type.ts
    │       ├── deploy-migrations.type.ts
    │       └── migration-stream.type.ts
    └── node/
        ├── commands/
        │   ├── runway-evidence.command.ts
        │   ├── runway-migrations-record.command.ts
        │   └── __tests__/
        ├── constants/runway-commands.constant.ts
        └── functions/read-migration-streams.function.ts
apps/docs/src/
├── config/docs.config.ts
└── docs/runway/
    ├── evidence.mdx
    └── migrations-record.mdx
.changeset/
└── migration-safety-classes.md
```

Tests sit in `__tests__/` beside each changed file.

## Data models and migrations

none (no migration added; the classifier reads the existing ones)

## Contracts

- `stackra.migration-safety/v1`: `{ schema, migrations: [{ id, owner, file, class, destructive, files, findings:
[{ step, statement, class, reason, sql }] }] }`.
- `runway.migrations/v1`: `{ schema, environment, sha, migrations: ["<member>:<id>", …] }`.
- `runway.evidence/v1`: unchanged shape; `destructive` and `destructiveMigrations` filled.
- `@stackra/gen` exports: `classifyMigrationStatement`, `classifyMigrations`, `emitMigrationSafety`,
  `MIGRATION_SAFETY_FILE`, types `MigrationSafety`, `MigrationSafetyRow`, `MigrationSafetyFinding`,
  `MigrationSafetyClass`.
- Gen refusal: `migration_banned` (file: the migration, subject: `<id> step <n> statement <m>`).

## Error handling

`migration_banned` is a gen refusal: the run writes nothing. In runway an unreadable safety file is unknown (`null`),
never an empty stream, and a bad `--previous` file is a `UsageError` (exit 2).

## Security and tenancy

The classifier never connects to a database. The safety file and the evidence hold schema SQL excerpts, ids and
classes, never row values. Every unknown resolves to floor.

## Testing strategy

- AC-001, AC-002, AC-003: `destructive-of.function.test.ts`, `deploy-evidence.function.test.ts`,
  `runway-evidence.command.test.ts` (temp repository with a service, a `--previous` file and a stale file).
- AC-004, AC-005: `classify-migrations.function.test.ts`, `compile-migrations.function.test.ts` (hermetic host with a
  data write).
- AC-007, AC-008: `stream-is-current.function.test.ts`, `runway-evidence.command.test.ts` (a service gen has not run
  on), `runway-migrations-record.command.test.ts`.
- AC-009: `split-sql-statements.function.test.ts`, `classify-migrations.function.test.ts`.
- AC-010: `classify-migration-statement.function.test.ts` (reads, `DO` blocks and assignments that call an unknown
  function, inline and block comments, quoted names), `sql-code-of.function.test.ts`.
- AC-006: the workspace `pnpm gen` run on box 2 and a classification of all 98 package migrations.
- Revert check: with the gen and runway sources put back to `main` (and the classifier short-circuited) 49 gen tests
  and 6 runway tests fail. Review fixes: with their gen and runway sources put back to the first commit, 19 gen tests
  fail (the split, `IF NOT EXISTS`, the empty safety file and 12 golden trees) and every runway test file fails to load
  (the wiring names the new command); with only `streamIsCurrent` put back, 3 runway tests fail.
  Review fixes 2: with the classifier and splitter put back to the second commit, 21 classifier tests fail (unknown
  calls in reads and `DO` blocks, `SELECT … INTO`, filled `CREATE TABLE … AS`, inline and block comments, quoted
  names). AC-006 after them: `stackra gen` exits 0 with no `migration_*` refusal in each of the 25 packages that hold
  the 98 package migrations (box 2, 2026-11-27).

## Rollout

A minor changeset for `@stackra/gen` and `@stackra/runway`. Services get the safety file on their next gen. Deploy
workflows add `--previous` when they start calling `runway evidence`.

## Delegation and risk plan

One session, one branch. Budget: one PR. Follow-up: in the template's deploy workflows, run `stackra gen` before `runway evidence`, run `runway migrations:record`
after the deploy step and pass the last successful run's record as `--previous`.

## ADRs

ADR 0159 (decision 3, decision 4, the 2026-10-23 note), ADR 0334 (rule 4), ADR 0533 (decision 3): all Accepted.

## Docs

`packages/developer/gen/README.md`, `packages/developer/runway/README.md`, `apps/docs/src/docs/runway/evidence.mdx`,
`apps/docs/src/docs/runway/migrations-record.mdx`, `.changeset/migration-safety-classes.md`.

## Complexity tracking

none
