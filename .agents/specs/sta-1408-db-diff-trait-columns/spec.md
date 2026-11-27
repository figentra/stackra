# Feature Specification: `stackra db diff` derives trait columns from the model's traits

**Feature Branch**: `figentra/sta-1408-db-diff-trait-columns`

**Created**: 2026-11-26

**Status**: Tasked <!-- Draft → Clarified → Planned → Tasked → Implementing → Done, or Abandoned / Superseded (OR12). spec-gate refuses a status ahead of its artifacts; append every change to Status history -->

**Tier**: feature

**Approver**: leader

**Linear**: STA-1408

**Linear project**: Stackra · product needs 2026-10-26

**Clarifications status**: complete

**Analyze**: —

**Input**: `stackra db diff` compares the schema the models declare with the schema the migrations build. It read a
trait's columns from the fields the checker saw and guessed their types by name, and it tolerated `tree_path` and
`metadata` on every table. So a `HasTree` model disagreed with `t.tree()` (`column_type tree_path`, `undeclared_index
idx_<table>_parent_id`), a `Partitioned({ by })` model with `t.partitionBy`'s BRIN index, and a stray `tree_path` or
`metadata` on a table without the trait went unreported. ADR 0096 decision 4 makes the trait registry (`traitsOf`)
the source of a model's traits. This spec is written after the fact from the PR's diff (#1130), built before the spec
gate (ADR 0502) required one.

### Sources

- `packages/developer/gen/src/core/functions/expected-schema.function.ts`, `diff-schemas.function.ts` and
  `postgres-type-of.function.ts` (before and after this change)
- `packages/developer/gen/src/node/functions/create-source-reader.function.ts` (trait arguments in discovery)
- `@stackra/database`'s `Blueprint` macros (`t.tree()`, `t.metadata()`, `t.partitionBy`, `t.hasPublicId`, the stamps)
  and the tenancy and iam macros (`t.belongsToTenant`, `t.owner()`), which the new table mirrors
- ADR 0096 (decision 4: the trait registry), ADR 0282 (decision 3: `stackra db diff`), ADR 0321 (decisions 2 and 4:
  `HasTree`, `HasMetadata`), ADR 0135 (public ids are `varchar(33)`), ADR 0133 (decision 7), ADR 0134 (decision 4),
  ADR 0239 (decision 1), ADR 0159
- FR-001 to FR-007: the PR's diff against `main`, its tests and the PGlite proof in the commit body

## Impact _(mandatory, answer every line before /flow-clarify completes)_

- **Apps touched**: none
- **Services touched**: none
- **Packages touched**: packages/developer/gen (`TRAIT_COLUMNS`, `traitColumnsOf`, `TraitColumns`, `SchemaSnapshot`,
  `expectedSchema`, `diffSchemas`, `postgresTypeOf`, the source reader), packages/developer/cli (README only)
- **Public contract change**: additive with one behaviour change. New exports `TRAIT_COLUMNS`, `traitColumnsOf` and the
  type `TraitColumns` from `@stackra/gen`; `SchemaSnapshot` columns may say `nullable: "either"` and indexes may be
  `optional` (expected side only). Behaviour: `tree_path` and `metadata` are no longer tolerated on a table whose
  model lacks the trait (now `undeclared_column`), and a `version` field is typed `integer` only under `Versioned`.
  Nothing is removed or renamed.
- **Cross-service events**: none
- **Tenancy and data**: none. `stackra db diff` reads only the schema catalog of a database it replays the migrations
  on; the tenant column's expectation (`varchar(33)`, not null or nullable by trait) is unchanged in meaning.
- **Security and privacy**: none
- **Secrets**: none
- **ADR needed**: no (implements ADR 0096 decision 4 and ADR 0282 decision 3 as written)
- **New dependencies**: none (`@stackra/support`'s `snakeCase` is already a dependency)
- **Deploy modes**: same in all three (a development-time check)
- **Licence tier**: free (MIT, this repo)
- **UI surfaces**: none
- **Docs to update**: `packages/developer/cli/README.md` (`stackra db diff`), `.changeset/db-diff-trait-columns.md`
  (minor for `@stackra/gen`, patch for `@stackra/cli`)
- **Lane**: full (new public exports and a behaviour change in a developer package)
- **Change risk**: R2 (a public contract of `@stackra/gen`; `stackra db diff` may now report columns it tolerated)

## Glossary _(full lane)_

- **Trait column**: a column a model trait's migration macro writes (`HasTree`'s `parent_id` and `tree_path`).
- **Registry code**: the snake_case name `createTrait` records and `traitsOf` returns (`HasTree` is `has_tree`).
- **Either nullable**: a column a macro writes not null on a new table and nullable on an existing one until a backfill
  (`t.tree()`'s `tree_path`).
- **Optional index**: an index a macro writes only on request (`t.metadata({ index: true })`, `t.partitionBy(column, {
brin: false })` leaves it out).

## User Scenarios & Testing _(mandatory)_

### User Story 1 - A tree model agrees with its migration (Priority: P1)

A developer adds `HasTree` to a model and `t.tree()` to its migration. `stackra db diff` reports no difference: it
expects `varchar(33)` `parent_id`, `ltree` `tree_path` (either nullable) and the GiST index.

**Why this priority**: today every tree model reports false differences, so developers learn to ignore the check.

**Independent Test**: `expectedSchema` and `diffSchemas` on a `HasTree` model against the snapshot `t.tree()` builds.

**Acceptance Scenarios**:

1. **Given** a `HasTree` model and a table built by `t.tree()`, **When** the schemas are diffed, **Then** nothing is
   reported, on a new table (path not null) and an existing one (path nullable).
2. **Given** a `HasTree` model whose table has `tree_path` as `text` or lacks the GiST index, **When** diffed, **Then**
   `column_type` or `missing_index` / `index_shape` (naming the access method) is reported.

---

### User Story 2 - A trait's column without the trait is reported (Priority: P1)

**Acceptance Scenarios**:

1. **Given** a table with `metadata` or `tree_path` whose model lacks `HasMetadata` or `HasTree`, **When** diffed,
   **Then** `undeclared_column` is reported.

---

### User Story 3 - Option-bearing traits are read (Priority: P2)

**Acceptance Scenarios**:

1. **Given** `Partitioned({ by: "at", retain: Duration.days(400) })`, **When** discovery reads the model, **Then** the
   trait keeps `by` although `retain` is not constant, and the BRIN index over `at` is expected as optional.
2. **Given** a `version` field, **When** the model lacks `Versioned`, **Then** its type is not guessed as `integer`.

---

### Edge Cases

- **EC-01**: A marker trait or one with no row (`AppendOnly`, `HasRevisions`) adds nothing; a trait named twice counts
  once.
- **EC-02**: A later trait's column of the same name wins, in the later trait's place, as the later mixin does.
- **EC-03**: A namespaced trait (`traits.HasTree`) is read by its last segment.
- **EC-04**: An own base model's traits apply first; an `@Index` of the same name wins over a trait's index.
- **EC-05**: `Partitioned` whose `by` is not a constant string adds no index.
- **EC-06**: An index's access method is compared only when the expected index names one.

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: `@stackra/gen` SHALL export `TRAIT_COLUMNS`, keyed by registry code, giving each column-writing trait's
  columns (name, Postgres type, nullability) and indexes (columns, access method, optional) as its macro writes them.
- **FR-002**: `traitColumnsOf(traits)` SHALL derive the columns and indexes of a model's traits, with `Partitioned({ by
})`'s optional BRIN index over the `by` column.
- **FR-003**: `expectedSchema` SHALL expect a model's trait columns and indexes, through its own base models, with the
  macro's type and nullability over the field the checker read.
- **FR-004**: `diffSchemas` SHALL accept either nullability for a `nullable: "either"` column, accept the absence of an
  `optional` index, and compare an index's access method when the expected index names one.
- **FR-005**: `diffSchemas` SHALL NOT tolerate `tree_path` or `metadata` on a table whose model lacks the trait.
- **FR-006**: `postgresTypeOf` SHALL NOT type a field as `integer` by its name `version`; the `versioned` row does.
- **FR-007**: discovery SHALL keep a trait object argument's constant properties when another property is not
  constant.

## Acceptance criteria _(mandatory for a tiered spec, ADR 0502)_

- **AC-001**: WHEN a `HasTree` model's table was built by `t.tree()` THE `stackra db diff` SHALL report no difference.
- **AC-002**: WHEN a trait's column or index differs in type, nullability or access method THE `stackra db diff` SHALL report it.
- **AC-003**: IF a table has `tree_path` or `metadata` and its model lacks the trait THEN THE `stackra db diff` SHALL report `undeclared_column`.
- **AC-004**: WHERE a model uses `Partitioned({ by })` THE `stackra db diff` SHALL expect an optional BRIN index over the `by` column, also when another option is not constant.
- **AC-005**: WHILE a model lacks `Versioned` THE `stackra db diff` SHALL NOT type its `version` field as `integer`.
- **AC-006**: THE `TRAIT_COLUMNS` table SHALL give each column-writing trait's columns and indexes with the type, nullability and access method its migration macro writes, keyed by registry code.

## Success Criteria _(mandatory)_

- **SC-001**: `trait-columns-of.function.test.ts` proves FR-001, FR-002 and EC-01 to EC-03, EC-05 — verified by: unit
- **SC-002**: `expected-schema.function.test.ts` ("trait columns") and `diff-schemas.function.test.ts` ("trait columns
  and indexes") prove FR-003 to FR-006 and AC-001 to AC-005 — verified by: unit
- **SC-003**: `create-source-reader.function.test.ts` proves FR-007 — verified by: unit
- **SC-004**: a generated app replayed on PGlite: `main` reported 7 false differences and missed 4 real ones; this
  branch reports exactly the 4 — verified by: manual
- **SC-005**: the `@stackra/gen` tests, typecheck, oxlint and oxfmt pass — verified by: manual

## Compatibility and migration

- A model whose table matches its traits sees fewer differences. A table carrying `tree_path` or `metadata` without the
  trait is now reported: add the trait to the model, or drop the column in a new migration.
- No generated file changes; only `stackra db diff`'s report.

## Risks

- **R-1**: `TRAIT_COLUMNS` mirrors macros gen cannot import; a macro change without a row change makes the check
  wrong. Mitigated: the constant's file contract says a new column-writing trait adds its row with its macro, and the
  tests pin each row.

## Out of scope

- Deriving the rows from the macros at run time (gen does not import `@stackra/database`'s runtime builders).
- Traits that write no column of their own.

## Assumptions

- Trait arguments that matter to the schema (`Partitioned`'s `by`) are written as constants in source.

## Open questions

None.

## Amendments

None.

## Status history

- 2026-11-26 · — → Draft · Claude (STA-1408 spec, batch 21) · written after the fact from the diff of PR #1130
- 2026-11-26 · Draft → Clarified · Claude (STA-1408 spec, batch 21) · clarifications complete (none open)
- 2026-11-26 · Clarified → Planned · Claude (STA-1408 spec, batch 21) · plan.md
- 2026-11-26 → Planned (plan.md) — Approved by Idris (CTO) 2026-11-26
- 2026-11-26 · Planned → Tasked · Claude (STA-1408 spec, batch 21) · tasks.md; the tasks marked done are already on the branch (PR); Implementing waits for the approver's Planned approval (ADR 0502)
