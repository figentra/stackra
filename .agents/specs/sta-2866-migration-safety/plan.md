# Implementation Plan: gen classifies migration safety and runway fills destructive in the deploy evidence

**Spec**: `.agents/specs/sta-2866-migration-safety/spec.md` · **Linear**: STA-2866 · **Date**: 2026-11-26

**Input**: Feature specification from `.agents/specs/sta-2866-migration-safety/spec.md`

## Summary

Gen gains a pure classifier, `classifyMigrationStatement`. It folds a compiled statement (drops comment lines, blanks
literals and dollar-quoted bodies) and matches it to an ADR 0159 class. `classifyMigrations` runs it over the ordered
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

- **P-001**: for every statement, the class is one of the four, and a statement gen cannot read is `contract` —
  Validates: FR-001
- **P-002**: for every migration, its class is the maximum of its statements' classes and `destructive` holds exactly
  for `contract` and `banned` — Validates: FR-002
- **P-003**: the safety file's step names equal the `.up.sql` names `emitMigrations` writes, in order — Validates:
  FR-002, FR-004
- **P-004**: a banned statement outside the released set always yields `migration_banned` and no files — Validates:
  FR-003
- **P-005**: `destructiveOf` never returns `false` while a stream is not current or a destructive migration lacks a
  baseline — Validates: FR-005
- **P-006**: `migrationKeysOf` returns keys only when every stream is current — Validates: FR-007

## Architecture overview

```text
compileMigrations ── orderMigrations ── classifyMigrations ──► { files, safety, errors(migration_banned) }
                                             │ classifyMigrationStatement (per statement, created tables)
generate ── writes .stackra/migrations/*.sql + .stackra/migration-safety.json (service) ── sweeps a leftover
runway evidence ── reads services/<m>/.stackra/{migration-safety.json, migrations/} ── destructiveOf(streams, --previous)
                └─ writes runway-evidence-<env>.json and runway-migrations-<env>.json
```

## Components and responsibilities

- `classifyMigrationStatement` (gen core): one statement to a class and a reason, plus the table it creates.
- `migrationSafetyRank` (gen core): the class order.
- `classifyMigrations` (gen core): the per-migration classes, findings, step names and refusals.
- `migrationStepNames` (gen core): the step file names, shared by `emitMigrations`.
- `emitMigrationSafety` and `MIGRATION_SAFETY_FILE` (gen core): the generated file.
- `RELEASED_BANNED_MIGRATIONS` (gen core): the nine frozen released ids.
- `compileMigrations` and `generate` (gen node): return and write the document; sweep a leftover file.
- `MIGRATION_SAFETY_FILE_SCHEMA` (runway core): what runway reads of the file.
- `SERVICE_TARGETS` (runway core): the targets that ship services, shared by the function and the command.
- `streamIsCurrent`, `destructiveOf`, `migrationKeysOf` (runway core): the judgement and the shipped keys.
- `deployEvidence` (runway core): `destructive` per target.
- `RunwayEvidenceCommand` (runway node): reads the streams, `--previous`, writes both files.

## Files and folders

- `packages/developer/gen/src/core/functions/classify-migration-statement.function.ts`
- `packages/developer/gen/src/core/functions/classify-migrations.function.ts`
- `packages/developer/gen/src/core/functions/migration-safety-rank.function.ts`
- `packages/developer/gen/src/core/functions/migration-step-names.function.ts`
- `packages/developer/gen/src/core/functions/emit-migration-safety.function.ts`
- `packages/developer/gen/src/core/functions/emit-migrations.function.ts`
- `packages/developer/gen/src/core/constants/migration-safety-file.constant.ts`
- `packages/developer/gen/src/core/constants/released-banned-migrations.constant.ts`
- `packages/developer/gen/src/core/types/classified-statement.type.ts`
- `packages/developer/gen/src/core/types/migration-safety-class.type.ts`
- `packages/developer/gen/src/core/types/migration-safety.type.ts`
- `packages/developer/gen/src/core/types/migration-safety-row.type.ts`
- `packages/developer/gen/src/core/types/migration-safety-finding.type.ts`
- `packages/developer/gen/src/core/index.ts`
- `packages/developer/gen/src/node/functions/compile-migrations.function.ts`
- `packages/developer/gen/src/node/functions/generate.function.ts`
- `packages/developer/runway/src/core/constants/migration-safety-file-schema.constant.ts`
- `packages/developer/runway/src/core/constants/service-targets.constant.ts`
- `packages/developer/runway/src/core/functions/destructive-of.function.ts`
- `packages/developer/runway/src/core/functions/stream-is-current.function.ts`
- `packages/developer/runway/src/core/functions/migration-keys-of.function.ts`
- `packages/developer/runway/src/core/functions/deploy-evidence.function.ts`
- `packages/developer/runway/src/core/types/migration-stream.type.ts`
- `packages/developer/runway/src/core/types/deploy-migrations.type.ts`
- `packages/developer/runway/src/core/types/deploy-evidence.type.ts`
- `packages/developer/runway/src/node/commands/runway-evidence.command.ts`
- tests beside each in `__tests__/`
- `packages/developer/gen/README.md`, `apps/docs/src/docs/runway/evidence.mdx`,
  `.changeset/migration-safety-classes.md`

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
- AC-006: the workspace `pnpm gen` run on box 2 and a classification of all 98 package migrations.
- Revert check: with the gen and runway sources put back to `main` (and the classifier short-circuited) 49 gen tests
  and 6 runway tests fail.

## Rollout

A minor changeset for `@stackra/gen` and `@stackra/runway`. Services get the safety file on their next gen. Deploy
workflows add `--previous` when they start calling `runway evidence`.

## Delegation and risk plan

One session, one branch. Budget: one PR. Follow-up: wire the `runway-migrations` artifact into the deploy workflows.

## ADRs

ADR 0159 (decision 3, decision 4, the 2026-10-23 note), ADR 0334 (rule 4), ADR 0533 (decision 3): all Accepted.

## Docs

`packages/developer/gen/README.md`, `apps/docs/src/docs/runway/evidence.mdx`, `.changeset/migration-safety-classes.md`.

## Complexity tracking

none
