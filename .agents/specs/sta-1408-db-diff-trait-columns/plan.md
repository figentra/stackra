# Implementation Plan: `stackra db diff` derives trait columns from the model's traits

**Spec**: `.agents/specs/sta-1408-db-diff-trait-columns/spec.md` · **Linear**: STA-1408 · **Date**: 2026-11-26

**Input**: Feature specification from `.agents/specs/sta-1408-db-diff-trait-columns/spec.md`

## Summary

A new data table, `TRAIT_COLUMNS`, mirrors what each column-writing trait's migration macro writes. `traitColumnsOf`
maps a model's discovered traits (the static form of `traitsOf`) to those rows, plus `Partitioned({ by })`'s optional
BRIN index. `expectedSchema` puts the trait columns and indexes over the fields the checker read; `diffSchemas` learns
`nullable: "either"`, `optional` indexes and the access method, and drops the blanket `tree_path` / `metadata`
tolerance. `postgresTypeOf` stops typing `version` by name. Discovery keeps an object argument's constant properties.

## Technical Context

- **Language**: TypeScript (ESM), Node 24
- **Members**: `packages/developer/gen` (`@stackra/gen`); `packages/developer/cli` (README)
- **Testing**: vitest in `src/**/__tests__/` (ADR 0022); a PGlite replay of a generated app for the end-to-end proof
- **Storage**: none
- **Runtime target**: isomorphic (the table and the derivation); node (the source reader)

## Constitution Check

| Law                                   | Result | Note                                                            |
| ------------------------------------- | ------ | --------------------------------------------------------------- |
| Boundaries (tier direction, ADR 0003) | PASS   | gen mirrors the macros as data; it imports no runtime package   |
| Secrets (ADR 0009)                    | N/A    | no secret is read or named                                      |
| Security                              | N/A    | a schema comparison only                                        |
| HTTP and events                       | N/A    | no route, header or event changes                               |
| Tenancy                               | PASS   | the tenant column's expectation is unchanged in meaning         |
| Delegation                            | PASS   | one session, one branch                                         |
| Not built yet (ADR 0011)              | PASS   | nothing from the table                                          |
| Test placement (ADR 0022)             | PASS   | tests sit in `__tests__/` beside each changed file              |
| Versions and catalogs                 | PASS   | no dependency added                                             |
| Deploy modes (ADR 0076)               | PASS   | development-time only                                           |
| Licence tier (ADR 0077)               | PASS   | free                                                            |
| Docs and ADRs                         | PASS   | CLI README and a changeset; implements ADR 0096 d4, ADR 0282 d3 |

## Deploy modes

| Mode       | Behaviour                                     |
| ---------- | --------------------------------------------- |
| SaaS       | `stackra db diff` reports trait columns right |
| On-prem    | same                                          |
| Air-gapped | same                                          |

## Correctness properties

- **P-001**: for every row of `TRAIT_COLUMNS`, the key and every column name are snake_case — Validates: FR-001
- **P-002**: `traitColumnsOf` is idempotent in a repeated trait and order-sensitive only for a shared column name — Validates: FR-002
- **P-003**: for every model with a trait row, `expectedSchema` contains each of the row's columns with the row's type and nullability — Validates: FR-003
- **P-004**: a snapshot built by the macro diffs empty against the model's expected schema — Validates: FR-004
- **P-005**: `tree_path` / `metadata` without the trait are always reported — Validates: FR-005
- **P-006**: for every field named `version`, `postgresTypeOf` returns no type of its own; only the `versioned` row types it — Validates: FR-006
- **P-007**: for every trait object argument, each property whose value is a constant survives discovery, whatever the other properties are — Validates: FR-007

## Architecture overview

Discovery records each model's traits with constant arguments. `expectedSchema` walks the model's own base chain
(base traits first), calls `traitColumnsOf`, and writes the trait columns with `put` (overriding the field-derived
column) and the trait indexes under `idx_<table>_<columns>` unless an `@Index` of the same name exists. `diffSchemas`
compares as before with the three new rules.

## Components and responsibilities

- `TraitColumns` (`src/core/types/trait-columns.type.ts`): the row shape.
- `TRAIT_COLUMNS` (`src/core/constants/trait-columns.constant.ts`): the rows.
- `traitColumnsOf` (`src/core/functions/trait-columns-of.function.ts`): the derivation.
- `SchemaSnapshot` (`src/core/types/schema-snapshot.type.ts`): `nullable: "either"`, `optional`.
- `expectedSchema`, `diffSchemas`, `postgresTypeOf` (`src/core/functions/`): the checks.
- The source reader (`src/node/functions/create-source-reader.function.ts`): trait object arguments.
- `src/core/index.ts`: the exports.

## Files and folders

```text
packages/developer/gen/
├── package.json
└── src/
    ├── core/
    │   ├── index.ts
    │   ├── __tests__/index.test.ts
    │   ├── constants/trait-columns.constant.ts
    │   ├── types/
    │   │   ├── trait-columns.type.ts
    │   │   └── schema-snapshot.type.ts
    │   └── functions/
    │       ├── trait-columns-of.function.ts
    │       ├── expected-schema.function.ts
    │       ├── diff-schemas.function.ts
    │       ├── postgres-type-of.function.ts
    │       └── __tests__/
    └── node/functions/
        ├── create-source-reader.function.ts
        └── __tests__/
packages/developer/cli/README.md
.changeset/db-diff-trait-columns.md
```

- `packages/developer/gen/src/core/constants/trait-columns.constant.ts`
- `packages/developer/gen/src/core/types/trait-columns.type.ts`
- `packages/developer/gen/src/core/types/schema-snapshot.type.ts`
- `packages/developer/gen/src/core/functions/trait-columns-of.function.ts`
- `packages/developer/gen/src/core/functions/expected-schema.function.ts`
- `packages/developer/gen/src/core/functions/diff-schemas.function.ts`
- `packages/developer/gen/src/core/functions/postgres-type-of.function.ts`
- `packages/developer/gen/src/node/functions/create-source-reader.function.ts`
- `packages/developer/gen/src/core/index.ts`
- `packages/developer/cli/README.md`, `.changeset/db-diff-trait-columns.md`

## Data models and migrations

none

## Contracts

- `TRAIT_COLUMNS: Readonly<Record<string, TraitColumns>>` (new export).
- `traitColumnsOf(traits: readonly { name; args }[]): TraitColumns` (new export).
- `TraitColumns { columns: { name; type; nullable: boolean | "either" }[]; indexes: { columns; method; optional? }[] }`.
- `SchemaSnapshot`: a column's `nullable` widens to `boolean | "either"`; an index gains `optional?: true`.
- Callers: `stackra db diff` (`@stackra/cli`) through `checkMigrationDrift`; no call site changes.

## Error handling

No new errors: differences are reported as before (`column_type`, `missing_index`, `index_shape`,
`undeclared_column`), and `index_shape` prints the access method only when the method is what differs.

## Security and tenancy

No data is read beyond the schema catalog of the replay database.

## Testing strategy

- AC-001: `diff-schemas.function.test.ts` ("agrees with a trait column of either nullability…"),
  `expected-schema.function.test.ts` ("types the columns a trait writes by the trait…").
- AC-002: `diff-schemas.function.test.ts` ("reports a trait's missing index and an index of another access method",
  "reports a trait column of another type").
- AC-003: `diff-schemas.function.test.ts` ("reports a migrated column no model declares, a trait's column included…").
- AC-004: `expected-schema.function.test.ts` ("…gives Partitioned its optional BRIN index"),
  `create-source-reader.function.test.ts`, `trait-columns-of.function.test.ts`.
- AC-006: `trait-columns-of.function.test.ts` ("TRAIT_COLUMNS" and "gives a trait's columns and indexes by its registry code").
- AC-005: `expected-schema.function.test.ts` ("types version as integer only under Versioned…"),
  `postgres-type-of.function.test.ts`.
- End to end: the PGlite replay of a generated app (7 false and 4 missed on `main`; exactly the 4 here).

## Rollout

Minor changeset for `@stackra/gen`, patch for `@stackra/cli`. A project that sees new `undeclared_column` lines fixes
its model or drops the stray column in a new migration.

## Delegation and risk plan

One session, one branch (PR #1130). Change risk R2.

## ADRs

ADR 0096 (decision 4), ADR 0282 (decision 3), ADR 0321 (decisions 2 and 4), ADR 0135, ADR 0159: all Accepted.

## Docs

`packages/developer/cli/README.md`, `.changeset/db-diff-trait-columns.md`.

## Complexity tracking

none
