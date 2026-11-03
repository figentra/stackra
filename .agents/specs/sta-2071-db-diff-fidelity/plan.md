# Implementation Plan: `db diff` fidelity: many-to-many pivots, search columns, deep predicate normalisation

**Spec**: `.agents/specs/sta-2071-db-diff-fidelity/spec.md` · **Linear**: STA-2071 · **Date**: 2026-11-03

**Input**: Feature specification from `.agents/specs/sta-2071-db-diff-fidelity/spec.md`

## Summary

`expectedSchema` learns two more things the IR already holds: each `m:n` relation yields its pivot table (named and
keyed as the ORM names them, with the owner's tenant column and same-module foreign keys), and a `@Searchable` model
yields `search_text` and `search_filters`. `diffSchemas` stops tolerating search columns everywhere: they are implied
only on a table that expects `search_text`. The predicate key gets a cast pattern that keeps the text after a cast and
folds the rewrites `pg_get_expr` makes (`= ANY (ARRAY[...])`, `<> ALL`, `~~`, `<>`, quoted identifiers, `between`).
The `ManyToManyOptions` comment is corrected to the pivot name the ORM uses.

## Technical Context

- **Language**: TypeScript (ESM), Node 24 (`mise.toml`)
- **Members**: `packages/developer/gen` (`tier:lib`); a comment in `packages/data/model`; a README section in
  `packages/developer/cli`
- **Testing**: vitest in `src/**/__tests__/` (ADR 0022)
- **Storage**: none (the comparison runs over an in-memory PGlite replay that this change does not touch)
- **Runtime target**: a library (gen, run by `stackra db diff`)

## Constitution Check

| Law                                   | Result | Note                                                                 |
| ------------------------------------- | ------ | -------------------------------------------------------------------- |
| Boundaries (tier direction, ADR 0003) | PASS   | gen's pure core only; no new import                                  |
| Secrets (ADR 0009)                    | PASS   |                                                                      |
| Security                              | PASS   | pure functions; no I/O                                               |
| HTTP and events                       | N/A    | no action, query, endpoint or event changes                          |
| Tenancy                               | PASS   | a pivot of a tenant-owned model is expected to carry `tenant_id`     |
| Delegation                            | PASS   |                                                                      |
| Not built yet (ADR 0011)              | PASS   | no new technology; no SQL parser dependency                          |
| Test placement (ADR 0022)             | PASS   | both tests sit in `core/functions/__tests__/`                        |
| Versions and catalogs                 | PASS   | no dependency or catalog change                                      |
| Deploy modes (ADR 0076)               | PASS   | same in all three                                                    |
| Licence tier (ADR 0077)               | PASS   | free                                                                 |
| Docs and ADRs                         | PASS   | the CLI README's `db diff` section; ADR 0159, 0221, 0282 already say |

## Deploy modes

| Mode       | Behaviour                          |
| ---------- | ---------------------------------- |
| SaaS       | same: a developer command, offline |
| On-prem    | same                               |
| Air-gapped | same                               |

## Correctness properties

- **P-001**: For every non-abstract model and every `m:n` relation in its shape chain, the expectation holds exactly
  one pivot table named `pivotTable ?? <owner table>_<snake(field)>`, with two key columns — Validates: FR-001, FR-002
- **P-002**: Each pivot foreign key references the owner table or a same-module target table, and is named
  `fk_<pivot>_<column>` — Validates: FR-003
- **P-003**: A pivot has a `tenant_id` column exactly when its owner table has one, with the same type and
  nullability — Validates: FR-004
- **P-004**: A table expects `search_text` and `search_filters` exactly when its model's class chain carries
  `@Searchable` — Validates: FR-005
- **P-005**: A migrated `search_*` column is tolerated exactly when the expected table has `search_text` — Validates:
  FR-006
- **P-006**: `predicateKey(source) === predicateKey(pg_get_expr(source))` for every rewrite FR-007 lists, and differs
  when a value, operator or connective differs — Validates: FR-007, FR-008

## Architecture overview

```
ir.shapes ─┬─► table columns ─────────────────┐
           ├─► m:n relations ─► pivot rows ───┼─► expectedSchema ─┐
ir.classes ┴─► @Searchable ─► search columns ─┘                   ├─► diffSchemas ─► SchemaDifference[]
readMigratedSchema (PGlite replay) ─► actual ─────────────────────┘     (search columns implied only where
                                                                         search_text is expected; predicateKey)
```

## Components and responsibilities

- `expectedSchema` (`src/core/functions/expected-schema.function.ts`): after a model's own columns, for each `m:n`
  relation of the chain, add the pivot's columns (and `tenant_id` when the owner has it) and foreign keys, keeping one
  entry per pivot name; when `classChain` carries a `Searchable` class facet on a `model` shape, add `search_text`
  (`text`) and `search_filters` (`jsonb`), both nullable. The contract comment drops the pivot and search shortcut.
- `diffSchemas` (`src/core/functions/diff-schemas.function.ts`): `IMPLIED_COLUMN` keeps `tree_path` and `metadata`; a
  new `SEARCH_COLUMN` pattern (`search_vector`, `search_vector_<locale>`, `search_text`, `search_filters`, each with an
  optional `__v<n>`) is implied only when the expected table has `search_text`, for both the undeclared-column and the
  undeclared-index checks. `predicateKey` gets the deeper normaliser of FR-007, with a shortcut note for the rest.
- `ManyToManyOptions` (`packages/data/model/src/core/types/many-to-many-options.type.ts`): the comment names
  `<table>_<field>`.

## Files and folders

- `packages/developer/gen/src/core/functions/expected-schema.function.ts`
- `packages/developer/gen/src/core/functions/diff-schemas.function.ts`
- `packages/developer/gen/src/core/functions/__tests__/expected-schema.function.test.ts`
- `packages/developer/gen/src/core/functions/__tests__/diff-schemas.function.test.ts`
- `packages/data/model/src/core/types/many-to-many-options.type.ts` (comment only)
- `packages/developer/cli/README.md` (the `db diff` section)
- `.changeset/sta-2071-db-diff-fidelity.md` (`@stackra/gen` patch, `@stackra/model` patch)

## Data models and migrations

none

## Contracts

`expectedSchema` returns more rows and `diffSchemas` reports drift it hid before; `SchemaSnapshot`,
`SchemaDifference` and the `stackra db diff` output format do not change. Additive.

## Error handling

No new refusal or difference kind. A pivot or search drift surfaces through the existing kinds (`missing_table`,
`missing_column`, `undeclared_column`, `missing_foreign_key`, `index_shape`), and `stackra db diff` keeps its exit
codes.

## Security and tenancy

none at runtime. The pivot's expected `tenant_id` makes `db diff` flag a tenant-owned pivot whose migration forgot the
tenant column, which the RLS policy needs.

## Testing strategy

- AC-001: `expected-schema.function.test.ts`: a derived and a named pivot with both keys and foreign keys; a
  self-reference (`products_1_id`, `products_2_id`); a cross-module or package target with no target foreign key; a
  tenant owner and a non-tenant owner; an `m:n` on an own base model; two relations naming one pivot.
- AC-003: the same file: `@Searchable` on the class and on an own base model gives the two search columns; a model
  without it gives none.
- AC-002, AC-004, AC-005: `diff-schemas.function.test.ts`: a matching pivot gives no difference and an absent one is
  `missing_table`; a searchable table without its columns gives `missing_column`; search columns on a plain table give
  `undeclared_column`; per-locale vectors, `__v2` shadows and a GIN index on a searchable table give nothing.
- AC-006: the same file: each FR-007 pair agrees (table-driven), a cast followed by `and ...` keeps its tail, and a
  changed value, operator or connective is still `index_shape`.
- Every new test carries `@covers sta-2071:FR-###`. The gen gate runs on ci-box.

## Rollout

A patch changeset for `@stackra/gen` and `@stackra/model`. `stackra db diff` reports more accurately on the next
install; no service declares an `m:n` or `@Searchable` model today, so no member's result changes.

## Delegation and risk plan

One agent, one pull request. Every install, typecheck and test runs on ci-box. Risk: low; both functions are pure and
covered by unit tests, and no other session edits them. Merge `origin/main` in before shipping.

## ADRs

ADR 0159 (the migration owns the schema), ADR 0282 decision 3 (`stackra db diff`), ADR 0221 decisions 1, 3 and 7
(search columns and versioned rebuilds), ADR 0294 decisions 20 and 28 (tables per module; links have no foreign
key), ADR 0231 (`idx_` and `fk_` names). All Accepted; no new ADR.

## Docs

`packages/developer/cli/README.md`, `db diff`: one sentence that many-to-many pivot tables and a `@Searchable` model's
search columns are compared, and that partial-index predicates compare as Postgres rewrites them.

## Complexity tracking

none
