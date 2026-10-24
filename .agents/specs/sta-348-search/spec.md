# Feature Specification: `@stackra/search` wave 5, Postgres hybrid search

**Feature Branch**: `figentra/sta-348-framework`

**Created**: 2026-10-24

**Status**: Implementing

<!-- Specs are public on GitHub: no secrets, customer data or details of an unfixed vulnerability (ADR 0120 D17). -->

**Linear**: STA-348

**Linear project**: Foundation kernel

**Clarifications status**: complete

**Input**: Build `@stackra/search` (data, wave 5): the search port, the Postgres hybrid driver and the reader of the
`@Searchable` facet that `@stackra/model` already ships, with the `t.searchable(...)` migration macro the template's
migrations call and the text function its trigram index calls (ADR 0221).

## Impact

- **Apps touched**: none
- **Services touched**: none (the template's commerce service, loyalty kit and access log adopt it once converted, STA-344)
- **Packages touched**: `packages/data/search` (new member); `packages/data/database` (one built-in column type,
  `t.tsvector(name)`, which the macro needs)
- **Cross-service events**: none
- **Tenancy and data**: the index lives in each searchable model's own table (three nullable columns the macro writes);
  this package's own migration adds only the `search` schema, the approved `pg_trgm` extension and one function; no
  tenant vocabulary (R-59); row-level security of the model's table applies to every search
- **Secrets**: none
- **ADR needed**: no (ADR 0221 decides the engine; ADR 0160, 0159 and 0294 bind it)
- **New dependencies**: none outside the workspace and the catalogs (`zod` from the default catalog); runtime edges to
  config, container, contracts, database, errors, model and validation
- **Deploy modes**: same code in all; Postgres 13 or later for the `arabic` configuration and `normalize`
- **Licence tier**: free (MIT; distributed on npmjs with provenance when released, ADR 0177)
- **Docs to update**: `packages/data/search/README.md`, `packages/data/search/AGENTS.md`; ADR 0221, 0160 and 0159 are cited and amended only by a note if a decision here changes
- **Lane**: lite
- **Change risk**: R2 (new public contract every searchable model and its migrations use)

## Clarifications

### Session 2026-10-24

The package follows ADR 0221, the v3.1 registry row and the owner decisions of 2026-10-24 (programming model v3 and
v3.1, ADR 0294, 0305). The choices recorded when it was specified:

- Registry row: entries `.` (`Search`) and `./contracts` (`SearchDriver`); the template's wiring imports
  `PostgresSearchDriver` from `./node` and `MemorySearchDriver` from `.`, so `./node` exists (ADR 0127 note: an entry
  exists once its folder has a file)
- The `@Searchable` facet stays `@stackra/model`'s; this package reads it with `Searchable.on`
- Macro extension point: `@stackra/database`'s `Macro` kind; it lacked a `tsvector` column type, added at its source
- No `unaccent` extension (not approved, ADR 0160): the folding function uses canonical decomposition instead
- Filters are denormalised into `search_filters` (jsonb), so a relation path such as `collections.slug` filters in one
  statement; the model's own btree indexes keep serving its resource table
- Owner, 2026-10-24 (R-59, ADR 0323): no tenant vocabulary; isolation is the model table's row-level security

## User Scenarios & Testing

### User Story 1 - Search a model from a query (Priority: P1)

A storefront query injects `Search` and calls `search.in(Product).page(q, { filters, cursor, limit, populate })`; it
gets loaded products, best first, with the next cursor.

**Independent Test**: `src/core/values/__tests__/search-index.value.test.ts`.

**Acceptance Scenarios**:

1. **Given** indexed products, **When** a phrase is searched with a filter, **Then** only rows holding the filter value
   are returned, in rank order, loaded with the asked relations.
2. **Given** a cursor no page gave, **When** a page is asked, **Then** it refuses `search_cursor_invalid`.

### User Story 2 - Add the search columns in a migration (Priority: P1)

A migration calls `t.searchable({ text, filters, locales })` and gets nullable, commented vector, text and filter
columns; its own lines add the GIN and trigram indexes after `search.0001_create_text_functions`.

**Independent Test**: `src/node/database/macros/__tests__/searchable.macro.test.ts`,
`src/node/database/migrations/__tests__/0001-create-text-functions.migration.test.ts`.

### User Story 3 - Rank in Postgres (Priority: P1)

The Postgres driver fuses a full-text lane and a trigram lane by reciprocal rank, every value bound.

**Independent Test**: `src/node/drivers/__tests__/postgres-search.driver.test.ts`.

### User Story 4 - Search Arabic and accented text (Priority: P2)

"مكتبة" finds "مَكْتَبَة"; "creme" finds "Crème".

**Independent Test**: `src/core/functions/__tests__/search-words-of.function.test.ts`.

### Edge Cases

- A phrase with no letter or digit: an empty page, with no engine call.
- A filter key the facet does not list: a `TypeError` (a programming error, not a caller's).
- A model without `@Searchable`: `search.in(Model)` throws a `TypeError`.
- A table with no search columns: the Postgres driver throws a `TypeError` naming `t.searchable(...)`.
- A row the session cannot see any more: left out of the page.

## Requirements

- **FR-001**: The package SHALL be `@stackra/search` at `packages/data/search`, `tier:lib`, entries `.`,
  `./contracts` and `./node` only.
- **FR-002**: It SHALL export every symbol the template imports: `Search` and `MemorySearchDriver` from `.`,
  `SearchDriver` from `./contracts`, `PostgresSearchDriver` from `./node`, and supply `t.searchable(...)` with the
  shape the template's migrations call.
- **FR-003**: `SearchConfig` with its shipped `SearchConfig$` SHALL key `search` with `driver` typed
  `DriverName<SearchDriver>` (`postgres` default, `memory`).
- **FR-004**: `SearchIndex` SHALL read the `@Searchable` facet, index documents built from populated rows, return
  loaded rows in the driver's rank order, page by cursor, and check limits, filter keys and cursors.
- **FR-005**: Documents and phrases SHALL share one normalisation that removes accents and Arabic diacritics and
  unifies Arabic letter variants; the migration's SQL function SHALL fold the same way.
- **FR-006**: `PostgresSearchDriver` SHALL rank with full-text and trigram lanes fused by reciprocal rank, run on the
  caller's entity manager, and bind every value as a parameter.
- **FR-007**: `SearchableMacro` SHALL write nullable, commented `search_vector` (or one per locale), `search_text`
  and `search_filters` columns and no index.
- **FR-008**: No identifier, comment or default in the package SHALL carry tenant vocabulary, and no extension outside
  ADR 0160's list SHALL be created.

## Success Criteria

- **SC-001**: Spec, plan, tasks and a changeset exist.
- **SC-002**: Every public symbol has a test in `src/**/__tests__/`; the tests run in the separate testing workflow
  (owner mode, 2026-10-24: not run here).
- **SC-003**: `oxfmt` and `oxlint` are clean on the package and the validator reports nothing for it; the typecheck
  waits for the integrator's install (a new package).

## Open items (for the owner, not blocking)

- The template's `catalogue.0005_add_product_search_columns` calls `t.searchable({ text, filters })` without
  `locales`, yet `0006` indexes `search_vector_en` and `search_vector_ar`; it needs `locales: ["en", "ar"]` (STA-344).
- Keeping documents current from the unit of work by itself needs the outbox (ADR 0221 d5) or an ORM subscriber kind,
  which no ADR names; until then writers call `index` and `remove`, and `reindex` backfills.
- ADR 0221's vector lane (pgvector, needs an embedding port), versioned index swap, palette, public search API and IAM
  predicate are later work.

## Status history

- 2026-10-24 · — → Implementing · Claude (package-builder) · spec for a package written in owner mode (develop now, test later)
