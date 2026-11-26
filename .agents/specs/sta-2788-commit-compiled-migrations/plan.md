# Implementation Plan: gen: commit the compiled migrations, and the apply path runs exactly the committed SQL

**Spec**: `.agents/specs/sta-2788-commit-compiled-migrations/spec.md` · **Linear**: STA-2788 · **Date**: 2026-11-25

**Input**: Feature specification from `.agents/specs/sta-2788-commit-compiled-migrations/spec.md`

## Summary

Gen's compiled migrations become committed output, like the manifest: a service's stream and its Encore copy, and a
package's own migrations compiled exactly as a host's stream holds them. `stackra gen --check` and the Quality Gate
fail on drift; runway's Encore deploy ships the committed SQL and refuses regenerated SQL; a host's gen refuses a
registry-installed package whose shipped SQL differs from its compile. Squawk lints the committed SQL.

## Technical Context

- **Language**: TypeScript, YAML (CI), SQL (generated)
- **Members**: `packages/developer/gen`, `packages/developer/runway`, the 25 packages with migrations (generated SQL)
- **Testing**: vitest (gen, runway), the Quality Gate
- **Storage**: none
- **Runtime target**: the next release

## Constitution Check

| Law                                   | Result | Note                                      |
| ------------------------------------- | ------ | ----------------------------------------- |
| Boundaries (tier direction, ADR 0003) | PASS   | gen and runway keep their own boundaries  |
| Secrets (ADR 0009)                    | N/A    | none                                      |
| Security                              | PASS   | the deploy refuses SQL it was not shown   |
| HTTP and events                       | N/A    | none                                      |
| Tenancy                               | PASS   | no schema change                          |
| Delegation                            | PASS   | Claude only                               |
| Not built yet (ADR 0011)              | N/A    | none                                      |
| Test placement (ADR 0022)             | PASS   | tests beside the functions in `__tests__` |
| Versions and catalogs                 | PASS   | one changeset (gen, runway minor)         |
| Deploy modes (ADR 0076)               | PASS   | the same in all three                     |
| Licence tier (ADR 0077)               | PASS   | free, MIT                                 |
| Docs and ADRs                         | PASS   | gen README, workflows README              |

## Deploy modes

| Mode       | Behaviour                                                 |
| ---------- | --------------------------------------------------------- |
| SaaS       | the Encore deploy applies the committed compiled SQL      |
| On-prem    | `stackra db migrate` applies the committed `.stackra` SQL |
| Air-gapped | as on-prem                                                |

## Correctness properties

- **P-001**: gen writes the compiled SQL deterministically, and `--check` reports any difference — Validates: AC-001,
  AC-002
- **P-002**: a package's committed SQL equals a host's stream file byte for byte — Validates: AC-004, AC-005
- **P-003**: the Encore deploy commit's compiled SQL is the source commit's — Validates: AC-003

## Architecture overview

`migrationStepFiles` builds one step's name and bytes for a service's stream (`emitMigrations`) and a package's
committed SQL (`emitPackageMigrations`). `generate` treats both, and the Encore copy, as committed output.
`compileMigrations` compares a registry-installed package's shipped SQL with its compile. `encoreDeployTree` never
copies compiled migrations from the working tree and refuses drift.

## Components and responsibilities

- gen: the emitters, `isCommittedMigration`, `generate`'s check and leftover removal, `compileMigrations`' drift check.
- runway: `encoreDeployTree`.
- CI: the gate's check step and the Squawk step.

## Files and folders

```text
packages/developer/gen/src/core/constants/package-migrations-dir.constant.ts
packages/developer/gen/src/core/functions/{migration-step-files,emit-package-migrations,is-committed-migration}.function.ts
packages/developer/gen/src/node/functions/{generate,compile-migrations}.function.ts
packages/developer/runway/src/node/functions/encore-deploy-tree.function.ts
packages/*/*/src/node/database/compiled-migrations/*.sql
.github/workflows/ci.yml, .gitignore, turbo.jsonc
```

## Data models and migrations

none; the compiled SQL is generated from the existing migrations, unchanged

## Contracts

`migration_package_drift` (gen refusal); runway's `RunwayUnresolvedError` for compiled-SQL drift at deploy

## Error handling

Refusals name the differing files and the fix (run `stackra gen`, commit, deploy that commit).

## Security and tenancy

The deploy applies only SQL that was committed and linted.

## Testing strategy

- AC-001, AC-002: gen's `generate` and `isCommittedMigration` tests; the gate step run locally.
- AC-003: runway's `encoreDeployTree` tests.
- AC-004: gen's `compileMigrations` tests.
- AC-005: the Squawk step run locally over the committed SQL.

## Rollout

A product adopts it by un-ignoring the folders, running gen and committing the SQL before its next deploy (the
changeset says so).

## Delegation and risk plan

Claude only; one wave; route `spec-task`. R2.

## ADRs

none

## Docs

gen README, `.github/workflows/README.md`

## Complexity tracking

none
