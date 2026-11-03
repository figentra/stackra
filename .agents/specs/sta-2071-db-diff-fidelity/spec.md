# Feature Specification: `db diff` fidelity: many-to-many pivots, search columns, deep predicate normalisation

**Feature Branch**: `figentra/sta-2071-db-diff-fidelity`

**Created**: 2026-11-03

**Status**: Draft

**Tier**: feature

**Approver**: leader

<!-- Specs are public on GitHub: no secrets, customer data or details of an unfixed vulnerability (ADR 0120 D17). -->

**Linear**: STA-2071

**Linear project**: none

**Clarifications status**: complete

**Analyze**: —

**Input**: Work package wp-28 of the gen coverage path, closing gap G-189: `stackra db diff` (STA-1808) does not
report faithfully.

- `packages/developer/gen/src/core/functions/expected-schema.function.ts:9-13`: "`@Searchable` declares no index here
  ... and the search columns are not expected; the comparison treats them as implied. A many-to-many pivot table is
  not expected either. shortcut: ..."; line 108 skips every relation that owns no column, so an `m:n` relation yields
  nothing.
- `packages/developer/gen/src/core/functions/diff-schemas.function.ts:24`: `IMPLIED_COLUMN` tolerates every
  `search_vector*`, `search_text*` and `search_filters*` column on every table, so a `@Searchable` facet added
  without a migration, or a migration's search columns left after the facet was removed, is never reported.
- `diff-schemas.function.ts:32-38`: the predicate key only drops parentheses, casts, case and spaces, and its cast
  pattern `::[a-z_]+( [a-z_]+)*` also swallows the words after a cast (`'a'::text and x` loses `and x`). Postgres
  prints `status in ('a', 'b')` as `(status = ANY (ARRAY['a'::text, 'b'::text]))`, `!=` as `<>`, `like` as `~~` and
  `between` as two comparisons, so a correct partial index is reported as `index_shape`.
- `diff-schemas.function.ts:108-111`: a table the migrations build that no model declares is `undeclared_table`, so
  every migrated pivot table is reported.

## Impact _(mandatory, answer every line before /flow-clarify completes)_

- **Apps touched**: none
- **Services touched**: none. No service declares a `@ManyToMany` or `@Searchable` model today; `stackra db diff`
  on them gives the same result.
- **Packages touched**: `packages/developer/gen` (`expectedSchema`, `diffSchemas` and their tests);
  `packages/data/model` (the contract comment of `ManyToManyOptions`, which names a pivot table the ORM does not use);
  `packages/developer/cli` (the `db diff` section of the README).
- **Public contract change**: additive. `expectedSchema` returns more rows (pivot tables, their key and tenant
  columns and foreign keys, and the `search_text` and `search_filters` columns of a `@Searchable` model), and
  `diffSchemas` reports drift it hid before. The `SchemaSnapshot` and `SchemaDifference` types do not change.
- **Cross-service events**: none
- **Tenancy and data**: none at runtime. The expected pivot table carries the owner's `tenant_id` column when the
  owner model has one, as the tenancy rule requires of every tenant-owned table; no table, policy or migration is
  written.
- **Security and privacy**: none. A pure comparison over an in-memory replay; no network, no secret, writes nothing.
- **Secrets**: none
- **ADR needed**: no. ADR 0159 (the migration owns the schema, the model is the declaration), ADR 0282 decision 3
  (`stackra db diff`), ADR 0221 (search columns) and ADR 0294 decisions 20 and 28 already decide what is compared;
  this makes the comparison match them.
- **New dependencies**: none
- **Deploy modes**: same in all three
- **Licence tier**: free (MIT, this repo)
- **UI surfaces**: none
- **Docs to update**: `packages/developer/cli/README.md` (the `db diff` section: pivots and search columns are
  compared); no `apps/docs` page describes the comparison rules.
- **Lane**: full
- **Change risk**: R1 (a developer command reports more accurately; no runtime, contract, data or permission change)

## Glossary _(full lane)_

- **Pivot table**: the join table of a `@ManyToMany` relation, owned by the declaring model, in its module's Postgres
  schema.
- **Search columns**: the columns `t.searchable({ text, filters })` writes for a `@Searchable` model: one
  `search_vector` (or `search_vector_<locale>` per locale), `search_text` and `search_filters`, each with a `__v<n>`
  shadow during a versioned rebuild (ADR 0221 decision 7).
- **Predicate key**: the normalised text of a partial index's `WHERE` clause that `diffSchemas` compares, so the
  model's `@Index(..., { where })` and Postgres's `pg_get_expr` rendering agree when they mean the same condition.

## User Scenarios & Testing _(mandatory)_

### User Story 1 - A many-to-many pivot is expected (Priority: P1)

A developer declares `@ManyToMany(() => ProductCollection) collections` on `Product` and writes the pivot migration.
Today `stackra db diff` reports the pivot as `undeclared_table`. After this change the pivot is part of the expected
schema, so a migrated pivot agrees and a pivot the migrations never built is `missing_table`.

**Why this priority**: a false difference on every pivot makes `db diff` exit 1 on a correct member, so nobody can
gate on it.

**Independent Test**: `expectedSchema` for a model with an `m:n` relation returns the pivot table's columns and
foreign keys; `diffSchemas` over that expectation and a migrated pivot returns no difference.

**Acceptance Scenarios**:

1. **Given** `Product` with `@ManyToMany(() => ProductCollection) collections`, **When** `expectedSchema` runs,
   **Then** it expects `products_collections` with `product_id` and `product_collection_id` (`varchar(33)`, not
   null) and the foreign keys `fk_products_collections_product_id` and `fk_products_collections_product_collection_id`.
2. **Given** `{ pivotTable: "product_collection_items" }`, **When** `expectedSchema` runs, **Then** the pivot is
   `product_collection_items`.
3. **Given** a migrated pivot that matches, **When** `diffSchemas` runs, **Then** it reports no `undeclared_table`.

---

### User Story 2 - `@Searchable` drift is reported (Priority: P1)

A developer adds `@Searchable` to a model and forgets the `t.searchable(...)` migration, or removes the facet and
leaves the columns. Today both pass. After this change the first gives `missing_column` for `search_text` and
`search_filters`, and the second gives `undeclared_column` for each search column.

**Why this priority**: search that silently has no columns, or columns nobody fills, is the drift `db diff` exists to
catch.

**Independent Test**: `expectedSchema` for a `@Searchable` model returns `search_text` and `search_filters`;
`diffSchemas` reports them missing when the migration lacks them and reports `search_*` columns as undeclared on a
table whose model has no facet.

**Acceptance Scenarios**:

1. **Given** a `@Searchable` model, **When** `expectedSchema` runs, **Then** its table expects `search_text` (text,
   nullable) and `search_filters` (jsonb, nullable).
2. **Given** a `@Searchable` model and a migration without `t.searchable`, **When** `diffSchemas` runs, **Then** it
   reports `missing_column` for `search_text` and `search_filters`.
3. **Given** a model without `@Searchable` and a migration with `t.searchable`, **When** `diffSchemas` runs, **Then**
   it reports `undeclared_column` for `search_vector`, `search_text` and `search_filters`.
4. **Given** a `@Searchable` model and its migrated columns, per-locale vectors and `__v<n>` shadows included, and
   their GIN and trigram indexes, **When** `diffSchemas` runs, **Then** it reports nothing.

---

### User Story 3 - A predicate Postgres rewrote is not `index_shape` (Priority: P2)

A developer writes `@Index(["status"], { where: "status in ('active', 'paused')" })` and the matching migration.
Postgres stores it as `(status = ANY (ARRAY['active'::text, 'paused'::text]))`. Today that is `index_shape`. After
this change the two compare equal.

**Why this priority**: a false `index_shape` on correct partial indexes; it bites less often than the pivot and search
cases.

**Independent Test**: `diffSchemas` over one index whose expected predicate is the source form and whose actual
predicate is Postgres's rendering reports nothing, for each rewrite listed in FR-007.

**Acceptance Scenarios**:

1. **Given** each source and rendered pair in FR-007, **When** `diffSchemas` compares them, **Then** it reports no
   `index_shape`.
2. **Given** two predicates that differ in meaning (another value, another operator, `and` against `or`), **When**
   `diffSchemas` compares them, **Then** it still reports `index_shape`.

---

### Edge Cases

- **EC-01**: A self-referencing `@ManyToMany` (`Product.related`) expects the ORM's self-reference columns
  `products_1_id` and `products_2_id`, both with a foreign key to `products`.
- **EC-02**: An `m:n` target that is not a model of the same module (no `targetModule`, or another one) gets the
  target key column but no foreign key to it, as an `m:1` does.
- **EC-03**: A pivot of an owner model that has a `tenant_id` column expects `tenant_id` with the owner's type and
  nullability; an owner without one gives a pivot without one.
- **EC-04**: An `m:n` declared on an own base model gives the concrete model's pivot (its table, its key column); an
  abstract model gets no pivot.
- **EC-05**: A `@Searchable` inherited from an own base model makes the concrete table searchable.
- **EC-06**: The automatic indexes of the pivot's `varchar(33)` columns and a GIN or trigram index over search
  columns of a searchable table stay tolerated, as today.
- **EC-07**: A cast followed by more of the predicate (`'a'::text and deleted_at is null`) keeps the words after the
  cast.
- **EC-08**: Two `m:n` relations of one model, or two models that name the same `pivotTable`, give one expected table
  per distinct name, with no duplicate columns.

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: WHEN a non-abstract model declares (or inherits from an own base model) an `m:n` relation THE
  `expectedSchema` function SHALL expect its pivot table in the model's module schema, named by the relation's
  `pivotTable` option, otherwise `<owner table>_<snake_case(field name)>`.
- **FR-002**: THE pivot SHALL expect two `varchar(33)` not-null key columns named as the ORM names them:
  `<snake_case(owner class)>_id` and `<snake_case(target class)>_id`, or `<owner table>_1_id` and
  `<owner table>_2_id` when the target is the owner itself.
- **FR-003**: THE pivot SHALL expect a foreign key `fk_<pivot>_<column>` from the owner key column to the owner table,
  and from the target key column to the target table when the target is a model of the same module.
- **FR-004**: WHEN the owner table expects a `tenant_id` column THE pivot SHALL expect the same `tenant_id` column.
- **FR-005**: WHEN a model carries `@Searchable` (on its class or an own base model) THE `expectedSchema` function
  SHALL expect `search_text` (`text`, nullable) and `search_filters` (`jsonb`, nullable) on its table.
- **FR-006**: THE `diffSchemas` function SHALL tolerate a migrated `search_vector`, `search_vector_<locale>` or
  `__v<n>` shadow search column only on a table whose expected columns include `search_text`, and SHALL report any
  `search_*` column on another table as `undeclared_column`; `tree_path` and `metadata` stay implied everywhere.
- **FR-007**: THE predicate comparison SHALL treat as equal a source predicate and Postgres's rendering of it, across:
  parentheses, case and spaces; casts, multi-word and array casts included (`::character varying`,
  `::timestamp with time zone`, `::text[]`), without dropping the text after them; double-quoted identifiers;
  `!=` and `<>`; `in (...)` and `= ANY (ARRAY[...])`; `not in (...)` and `<> ALL (ARRAY[...])`; `like`, `ilike` and
  their negations against `~~`, `~~*`, `!~~` and `!~~*`; and `x between a and b` against `x >= a and x <= b`.
- **FR-008**: IF two predicates differ in a value, an operator or a connective THEN THE comparison SHALL still report
  `index_shape`.
- **FR-009**: THE `ManyToManyOptions` contract comment SHALL name the pivot table the ORM uses without the option
  (`<table>_<field>`), the one FR-001 expects.

### Key Entities _(include if feature involves data)_

- **SchemaSnapshot**: unchanged; the expected side gains pivot and search rows.
- **SchemaDifference**: unchanged; no new kind.

## Acceptance criteria _(mandatory for a tiered spec, ADR 0502)_

- **AC-001**: WHEN a model declares `@ManyToMany` THE `expectedSchema` function SHALL return the pivot table's key
  columns, its tenant column when the owner has one, and its foreign keys, named as FR-001 to FR-004 say.
- **AC-002**: WHEN the migrations build a matching pivot THE `diffSchemas` function SHALL report no `undeclared_table`
  for it, and WHEN they do not build it THE function SHALL report `missing_table`.
- **AC-003**: WHEN a model carries `@Searchable` THE `expectedSchema` function SHALL return `search_text` and
  `search_filters` for its table.
- **AC-004**: IF a `@Searchable` model's migration lacks the search columns THEN THE `diffSchemas` function SHALL
  report `missing_column`, and IF a table without the facet has search columns THEN it SHALL report
  `undeclared_column`.
- **AC-005**: WHEN a searchable table has its per-locale vectors, shadow columns and search indexes THE `diffSchemas`
  function SHALL report nothing about them.
- **AC-006**: WHEN an expected predicate and Postgres's rendering differ only by a rewrite FR-007 lists THE
  `diffSchemas` function SHALL report no `index_shape`, and WHEN they differ in meaning it SHALL report one.

## Success Criteria _(mandatory)_

- **SC-001**: Pivot and search expectations hold for each scenario above — verified by: unit
  (`expected-schema.function.test.ts`).
- **SC-002**: A migrated pivot, a matching searchable table and each rewritten predicate give no difference, and each
  drift case gives the documented kind — verified by: unit (`diff-schemas.function.test.ts`).
- **SC-003**: The gen package's gate (format, lint, typecheck, test, build) is green — verified by: ci-box run.

## Out of scope

- A two-sided `@ManyToMany` (a `mappedBy` option): the emitter already treats each side as an owner (its own
  shortcut), so each side gives its own pivot here too.
- Checking that `t.searchable`'s text and filter literals match the facet: `checkSearchableDrift` already refuses that
  (`searchable_columns_drift`).
- `@Searchable` on a projection or model addition (gap H-43, a separate package).
- Extra pivot columns (an ordering column, a payload): `@ManyToMany` declares none; a migration that adds one gets
  `undeclared_column`.
- A full SQL parser for predicates: FR-007's rewrites cover what `pg_get_expr` prints for the conditions a model's
  `where` can state; anything beyond stays `index_shape` and the normaliser carries a shortcut note.
- Writing migrations (`db diff --write`), which ADR 0159 leaves unbuilt.

## Assumptions

- The pivot names follow what the generated entities make MikroORM use, because `db diff` checks the schema the ORM
  reads. `emitEntities` passes `pivotTable` only when the option is set; without it MikroORM 7's
  `UnderscoreNamingStrategy` names the pivot `<owner table>_<field>` (`joinTableName`), the owner key
  `<snake(owner class)>_id`, the target key `<snake(target class)>_id`, and a self-reference
  `<owner table>_1_id` and `<owner table>_2_id` (`MetadataDiscovery.initManyToManyFields`). The `ManyToManyOptions`
  comment's `<table>_<target table>` matches no code and would collide for two relations to one target, so the comment
  is corrected (FR-009) rather than the ORM name changed.
- Migrations build pivot keys with `t.belongsTo(table, { column })`, which writes `varchar(33)` with
  `fk_<table>_<column>`, so the expected foreign keys have the names the migrations write.
- `t.searchable` always writes `search_text` and `search_filters` and one vector per locale; the facet does not name
  locales, so vectors are tolerated on a searchable table rather than expected one by one.
- `t.string(name)` without a length is `text`, and `postgresTypeAgrees` accepts `text` for any `varchar`, so the
  expected `search_text` type agrees with what the macro writes.

## Amendments

None.

## Status history

- 2026-11-03 · — → Draft · Claude (STA-2071 session) · created
