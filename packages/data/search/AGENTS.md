# AGENTS — @stackra/search

<!--
Stackra file contract:
Purpose: the agent rules of @stackra/search: where code goes, entries and barrels, the package rules, the rules that fail the build and PII.
Boundary: documentation only; the code and the ADRs win on any difference.
Runtime: none
Governing contract: ADR 0221; ADR 0160; ADR 0294; ADR 0404; STA-1251 (word helpers, Arabizi switch, across filters, HNSW); ADR 0380 and STA-1326 (semantic indexing); ADR 0089 d5 and ADR 0461 (conformance suite).
-->

Hybrid search over a model's `@Searchable` index: the `SearchDriver` port, the `Search` reader, the memory and
Postgres drivers, the `t.searchable(...)` macro and the text-function migration (ADR 0221). Member at
`packages/data/search` (`tier:lib`), in the programming model v3.1 shape (ADR 0294, 0305). Entries `.`,
`./contracts`, `./node`, `./testing`.

## Where code goes

| You are writing…                         | It goes in…                                                 |
| ---------------------------------------- | ----------------------------------------------------------- |
| The configuration (`SearchConfig`)       | `src/config/search.config.ts`                               |
| The settings group (`SearchSettings`)    | `src/core/search.settings.ts`                               |
| Its options shape                        | `src/core/schemas/search-options.schema.ts`                 |
| Its shipped zod schema (`SearchConfig$`) | `src/core/constants/search-config-schema.constant.ts`       |
| The port or a type it uses               | `src/contracts/{ports,types}/`                              |
| An isomorphic driver, function, refusal  | `src/core/{drivers,functions,errors}/`                      |
| A server driver                          | `src/node/drivers/`                                         |
| The outbox change consumers              | `src/node/services/{searchable,semantic}-change.service.ts` |
| A migration macro                        | `src/node/database/macros/<name>.macro.ts`                  |
| A migration                              | `src/node/database/migrations/<NNNN>-<name>.migration.ts`   |
| A conformance case or its runner         | `src/testing/` (`./testing`, imports `./contracts` only)    |
| A test                                   | `__tests__/<name>.<kind>.test.ts` beside it                 |

## Entries and barrels

- `src/{core,contracts,node}/index.ts` are stand-in barrels until gen writes the entry barrels (STA-339); add every new
  public file to its barrel and to that entry's `index.test.ts`.
- `src/contracts/` is the leaf; `core` and `node` import it through `#contracts/index`.
- `SearchConfig$` mirrors `SearchOptions` by hand until gen compiles this package's schemas; change both together.
- `SEARCH_DRIVERS` names each driver by its file prefix; a new driver adds its name there.
- `src/node/types/searchable-blueprint.type.ts` stands in for the `Blueprint` merge gen writes from the macro; keep its
  signature equal to `SearchableMacro.apply`'s.

## This package

- One normalisation: `searchWordsOf` (Arabic through `@stackra/i18n`'s `normalizeArabic`, never a local copy) for
  documents and phrases, and `search.fold` (migration 0003) for the trigram index. Change the two together; a released migration is frozen, so a change is a new migration.
- Synonyms are settings data (`search.synonyms`), never code: `SearchIndex` reads them per call through the
  `SettingsReader` `Search` is given and passes them as `SearchRequest.alternatives`, so every driver applies them in
  every lane it has. Terms go through `searchWordsOf` before they reach a driver (they land in a tsquery). The line
  form is `SEARCH_SYNONYM_LINE`; the settings schema and `searchSynonymsOf` both read it.
- Automatic indexing goes through `@stackra/outbox` only (`registerSearchableModels`); outbox must never depend on
  search. `SEARCHABLE_MODELS` stays internal.
- Semantic indexing (`@Searchable({ semantic: true })`) goes through `SemanticChangeService` only: it is
  `Lifetime.Transient` so boot never builds the `Embedder`; keep it so. `semanticPassageOf` runs the `ai: never` guard
  (ADR 0380) on every row before any text reaches the embedder; never embed a field around it. Passage ids are
  `<Model>:<key>`, metadata `{ source: "search", model }`, scope from the row's own `scopeId`/`scopePath`, never input.
- Drivers deal in ids and documents; only `SearchIndex`, `SearchableChangeService` and `SemanticChangeService` (one row load and populate) touch the ORM. Isolation is the database's: never add a
  scope filter in application code (ADR 0327 d9). The one exception is an engine that keeps its own copy of the
  documents (`SearchDriver.isolatesScopes` false: memory, the Pro engines): each `SearchDocument` carries its row's
  `scope` (from `scopeId`/`scopePath`, never input) and `SearchIndex` passes the session's `app.scope_paths` as
  `SearchRequest.scopePaths`, which the driver must apply to matches and facet counts (ADR 0089 d6). Postgres sets
  `isolatesScopes` true and gets none.
- A full rebuild runs only as `ReindexSearchAction` (a job), which records its cursor in `search.indexes` through
  `SearchIndexRegistry`; never loop `SearchIndex.reindex` in a request. The registry holds counts and states only, no
  row data, and has no RLS; only platform code reads it. The CLI reaches it through `searchReindex`/`searchStatus`.
- Record visibility is the one narrowing a search adds, and it goes in before ranking and before facet counting: `SearchIndex` passes
  `visibleKeysQuery`'s subquery as `SearchRequest.visible`, and a driver applies it in every lane or refuses (ADR 0333).
- Snippets read the field's data class: a `no_snippet` field is excerpted only when the caller says the user is on the
  record's team; team membership is IAM's answer, never decided here (ADR 0341).
- `searchWordsOf` and `arabiziOf` are public (`.`): callers fold search text with them, never a copy. The Arabizi
  alternative is on unless a read passes `arabizi: false`; it only adds a spelling, so the switch narrows and never
  widens.
- `Search.across` filters are per model (`Map<model, filters>`), each checked by that model's `SearchIndex`.
- `VectorIndex` (`search.vector_items`) is the platform's one vector store (ADR 0465): @stackra/ai retrieves and will
  store conversation memory through it, and keeps no vector table of its own. Add a vector need here, not a table.
- `PgvectorVectorIndexDriver` works at the one dimension `search.embedder.dimensions`: it refuses other sizes and
  queries `"embedding"::vector(n)` where `vector_dims("embedding") = n`, the partial HNSW index's exact expression and
  predicate (migration 0004 for 1024). Change the query and the index together; `n` is interpolated only as the checked
  configured integer.
- Raw SQL only in `PostgresSearchDriver` and `PgvectorVectorIndexDriver`, every value bound, identifiers quoted, configuration names from
  `TEXT_SEARCH_CONFIGS`, each statement with a `// raw-sql:` reason (ADR 0160).
- Extensions only through `schema.createExtension` from the approved list (ADR 0160, ADR 0334 rule 3): no `unaccent`.
- No parameter properties and no `#private` fields: services typecheck this source under `erasableSyntaxOnly`.

- `./testing` is the `SearchDriver` conformance suite (ADR 0089 d5): framework-free, it imports only `./contracts`,
  so Pro drivers run it without the rest of this package. A new port rule gets a case in
  `SEARCH_CONFORMANCE_CASES` (a fresh table per case, id sets not order); the memory driver must keep passing it
  (`run-search-conformance.function.test.ts`). Changing a case changes every recorded fixture of the Pro drivers.
- This package never imports `@stackra-pro/*` (ADR 0077 d4, ADR 0461).
- `SearchHealthIndicatorDriver` is the `HealthIndicator` driver: it searches `health.table` for one id with no words, bounded by `health.timeout`; `health.critical: false` reports `degraded` instead of `down`. It reports the error's name, never its message.

## Rules that fail the build

- A package never imports an app, a service, `encore.dev`/`~encore/*`, or another package's `src/`.
- Versions are `catalog:<name>` or `workspace:*` only.
- Coverage meets the shared gate (lines/functions 80, branches 70).

## PII

| Data           | Where                                           | Handling                                                                                        |
| -------------- | ----------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| Indexed text   | the model table's search columns, memory driver | Copies of the facet's text fields; `remove` clears them on erasure; ADR 0134 decides the fields |
| Search phrases | `SearchRequest.words`                           | Passed to the engine as bound parameters; never stored or logged here                           |
| Embedder token | `SecretStore` (`search.embedder.tokenSecret`)   | Read at call time by name; never logged, kept or put in an error (ADR 0173)                     |
