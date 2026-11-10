# Implementation Plan: Encore's migration copy builds online indexes in its one transaction

**Spec**: `.agents/specs/sta-2678-encore-online-index/spec.md` · **Linear**: STA-2678 · **Date**: 2026-11-10

**Input**: Feature specification from `.agents/specs/sta-2678-encore-online-index/spec.md`

## Summary

A pure helper, `encoreMigrationSql(content)`, rewrites one compiled migration file for Encore's runner: a file that
opens with `-- stackra:transactional=false` loses the marker (Encore cannot honour it) and its concurrent statements
lose `concurrently`; any other file is returned as it is. `generate` applies it to the Encore copy only.

## Technical Context

- **Language**: TypeScript (ESM)
- **Members**: `packages/developer/gen` (developer)
- **Testing**: vitest in `src/**/__tests__/`, on the Testbed and CI
- **Storage**: none
- **Runtime target**: every service's generated Encore app

## Constitution Check

| Law                                   | Result | Note                                                  |
| ------------------------------------- | ------ | ----------------------------------------------------- |
| Boundaries (tier direction, ADR 0003) | PASS   | gen only                                              |
| Secrets (ADR 0009)                    | N/A    | none                                                  |
| Security                              | N/A    | none                                                  |
| HTTP and events                       | N/A    | none                                                  |
| Tenancy                               | N/A    | the same indexes                                      |
| Delegation                            | PASS   | Claude only                                           |
| Not built yet (ADR 0011)              | N/A    | none                                                  |
| Test placement (ADR 0022)             | PASS   | tests in `__tests__/`                                 |
| Versions and catalogs                 | PASS   | a changeset patches @stackra/gen                      |
| Deploy modes (ADR 0076)               | PASS   | same in all three                                     |
| Licence tier (ADR 0077)               | PASS   | free, MIT                                             |
| Docs and ADRs                         | PASS   | ADR 0159 amendment note: the path of each environment |

## Deploy modes

| Mode       | Behaviour                                                                    |
| ---------- | ---------------------------------------------------------------------------- |
| SaaS       | dev and staging apply Encore's copy; production applies `stackra db migrate` |
| On-prem    | the same: `stackra db migrate` in production, with the online form           |
| Air-gapped | the same: `stackra db migrate` in production, with the online form           |

## Correctness properties

- **P-001**: a non-transactional file's Encore copy has no `concurrently` and no transactional marker — Validates:
  AC-001
- **P-002**: a transactional file is returned unchanged, and `.stackra/migrations` is not rewritten — Validates:
  AC-002

## Architecture overview

`generate` already maps each compiled file to its Encore path; the map now also maps its content through the helper.

## Components and responsibilities

- `encoreMigrationSql`: the Encore form of one compiled file.
- `generate`: applies it to the Encore copy.

## Files and folders

```text
packages/developer/gen/
  src/core/functions/encore-migration-sql.function.ts
  src/core/functions/__tests__/encore-migration-sql.function.test.ts
  src/node/functions/generate.function.ts
apps/docs/src/docs/adr/0159-migrations-gen-ordered-sql-and-safety-rules.mdx
.changeset/gen-encore-online-index.md
```

## Data models and migrations

none; migration 0006 stays frozen.

## Contracts

none changed.

## Error handling

none new: a plain build that fails rolls back with Encore's transaction.

## Security and tenancy

none.

## Testing strategy

- AC-001, AC-002: the helper's unit test (online file, its down file, a transactional file).
- AC-002: no golden fixture compiles migrations, so the goldens stay byte-identical.

## Rollout

A patch changeset for `@stackra/gen`, in 0.33.1, after stackra#1015 (the Encore service folder).

## Delegation and risk plan

Claude only; one wave; route `spec-task`. R2.

## ADRs

ADR 0159: an amendment note dated 2026-11-10.

## Docs

ADR 0159 only.

## Complexity tracking

none
