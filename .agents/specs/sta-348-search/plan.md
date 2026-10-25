# Plan: `@stackra/search` wave 5

**Spec**: `.agents/specs/sta-348-search/spec.md`

## Design

- Three entries through stand-in barrels (STA-339 replaces them): `./contracts` from `src/contracts/` (the leaf: the
  port and its types), `.` from `src/core/` with `src/config/`, `./node` from `src/node/` (the module groups
  `drivers/`, `database/macros/`, `database/migrations/`).
- `Search` is a platform service over `SearchDriver` and `Database`; `search.in(Model)` builds a `SearchIndex` value
  that reads the facet (`Searchable.on`) and the ORM metadata (table, schema, primary key), builds documents
  (`searchDocumentOf`) and phrase words (`searchWordsOf`), and loads the ranked rows through the entity manager.
- Drivers deal in ids and documents only. `MemorySearchDriver` ranks by field weight with every word required.
  `PostgresSearchDriver` reads a table's vector columns from the catalogue once, writes weighted `tsvector`s per locale
  (stemmed by `TEXT_SEARCH_CONFIGS`), the folded text and the filter values, and ranks with two lanes fused by
  reciprocal rank (k = 60, 1000 candidates per lane).
- `SearchableMacro extends Macro` writes the columns; `searchable-blueprint.type.ts` stands in for gen's `Blueprint`
  merge. `CreateTextFunctionsMigration` creates `pg_trgm` and `search.unaccent_immutable(text)`.
- `SearchConfig extends Config({ schema: SearchOptions })`, with `SearchConfig$` registered beside it as
  `FilesystemConfig$` is.

## Constitution Check

| Law                                   | Result | Note                                                                                                     |
| ------------------------------------- | ------ | -------------------------------------------------------------------------------------------------------- |
| Boundaries (tier direction, ADR 0003) | PASS   | `tier:lib` at `packages/data/search`; imports only `tier:lib` packages; no app, service or `encore.dev`  |
| Secrets (ADR 0173)                    | N/A    | no secret is read, stored or logged; the driver uses the service's own connection                        |
| Security                              | PASS   | every SQL value is bound; identifiers quoted; the cursor and the limit are checked; phrase words capped  |
| HTTP and events                       | N/A    | no endpoint or event; the cursor refusal is a `Validation` refusal (400)                                 |
| Tenancy                               | PASS   | reads and writes run in the caller's scope session under the table's row-level security; no tenant words |
| Delegation                            | PASS   | `package-builder` (route `package`) writes the code and `test-engineer` (route `tests`) runs the tests   |
| Not built yet (ADR 0227)              | PASS   | Postgres search, no deferred engine; `pg_trgm` is approved (ADR 0160); no `unaccent`                     |
| Test placement (ADR 0022)             | PASS   | every test sits in `src/**/__tests__/` beside its subject                                                |
| Versions and catalogs                 | PASS   | `catalog:` and `workspace:*` only                                                                        |
| Deploy modes (ADR 0076)               | PASS   | one build in SaaS, on-prem and air-gapped                                                                |
| Licence tier (ADR 0077)               | PASS   | MIT with `LICENSE`                                                                                       |
| Docs and ADRs                         | PASS   | README, AGENTS, file contracts and TSDoc; ADR 0221 stands, the open items are listed in the spec         |

- Boundaries: runtime imports of config, container, contracts, database, errors, model and validation; dev-only
  `@stackra/testing` and the tooling presets.
- Versions: catalogs and `workspace:*` only.
- Naming: drivers `<Name>Driver`, the macro `SearchableMacro`, the refusal ends in `Error`, no `define` prefix; `Search`
  keeps the template's platform name (as `GraphQuery` does).

## Properties

- **P-001**: `package.json` names `@stackra/search` at `packages/data/search` and `exports` lists only `.`, `./contracts` and `./node` — Validates: FR-001
- **P-002**: each entry's `index.test.ts` lists exactly the template's symbols with their siblings, and a migration calling `t.searchable({ text, filters })` compiles — Validates: FR-002
- **P-003**: `buildConfig(SearchConfig)` equals `SearchConfig$.parse({})` with driver `postgres`, `memory` builds, and another name refuses — Validates: FR-003
- **P-004**: for every indexed set and phrase, `page` returns the loaded rows of the driver's ids in order, `hasMore` exactly when the driver returned more than `limit`, and refuses an unlisted filter, a limit outside 1 to 100 and a forged cursor — Validates: FR-004
- **P-005**: for every text, `searchWordsOf` output has no combining mark, tatweel, tashkeel, alef wasla, alef maqsura or teh marbuta, and the migration's function strips the same ranges — Validates: FR-005
- **P-006**: for every request, the driver's SQL has exactly as many placeholders as parameters, in order, and no request value appears in the SQL text — Validates: FR-006
- **P-007**: for every column list, the macro's columns are nullable and commented, one vector per locale, and the compiled SQL has no `create index` — Validates: FR-007
- **P-008**: `grep -ri tenant packages/data/search/src` finds nothing, and the only extension created is `pg_trgm` — Validates: FR-008
- **P-009**: for every change of a registered model, the consumer calls `index` with the loaded row exactly when the change is not a delete and the row is found, and `remove` with its id otherwise; a model nobody registered is ignored, and a refused registration records nothing — Validates: FR-009

## Deploy modes

| Mode       | Behaviour                                                                    |
| ---------- | ---------------------------------------------------------------------------- |
| SaaS       | the same build; the index lives in each service's own Postgres               |
| On-prem    | identical: the same build, no SaaS-only code path                            |
| Air-gapped | identical: needs no network; Postgres ranks in the deployment's own database |
