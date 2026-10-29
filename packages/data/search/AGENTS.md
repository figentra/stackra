# AGENTS — @stackra/search

<!--
Stackra file contract:
Purpose: the agent rules of @stackra/search: where code goes, entries and barrels, the package rules, the rules that fail the build and PII.
Boundary: documentation only; the code and the ADRs win on any difference.
Runtime: none
Governing contract: ADR 0221; ADR 0160; ADR 0294; ADR 0404; STA-1251 (word helpers, Arabizi switch, across filters, HNSW); ADR 0380 and STA-1326 (semantic indexing); ADR 0089 d5 and ADR 0461 (conformance suite); data-layer gaps se3 and se4 (batched consumers, parent invalidation); se8 / stackra-301 (vector lane, `similar`, content hash, chunker); se7 / stackra-303 (versioned index swap); se9 / stackra-302 (facet field kinds); se11 to se13 / stackra-326 (ranking rules, query log,
suggest).
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
  search. `SEARCHABLE_MODELS` and `SEARCH_RELATIONS` stay internal.
- A dotted facet path's related models come from the facet and the relation decorators (`searchRelationsOf`), never a
  hand list: `registerSearchableModels` watches each with `RelatedChangeService`, which finds the parents through the
  ORM relation path under row-level security. Both consumers skip an update that writes no field the document reads
  (`changeTouches`); a field that decides presence (`SEARCH_PRESENCE_FIELDS`) is never skipped. Add such a field
  there, never in a consumer.
- A passage id is `passageIdOf(Model, id)` (`<Model>:<id>`); `SemanticChangeService` and `SearchForgetService` both
  use it. Never import @stackra/privacy here: privacy depends on search (through workflow, rules and ai), so erasure
  calls `SearchForgetService` from its side.
- Semantic indexing (`@Searchable({ semantic: true })`) goes through `SemanticChangeService` only: it is
  `Lifetime.Transient` so boot never builds the `Embedder`; keep it so. `semanticPassageOf` runs the `ai: never` guard
  (ADR 0380) on every row before any text reaches the embedder; never embed a field around it. Passage ids are
  `<Model>:<key>` (then `#1`... for a chunked row, at most `MAX_SEMANTIC_CHUNKS`; `passageIdsOf` lists every slot, so
  a removal always takes `passageIdsOf`, never one id), metadata `{ source: SEMANTIC_SOURCE, model, row, hash }`, scope
  from the row's own `scopeId`/`scopePath`, never input. `hash` (text, scope path, embedder model and dimension) skips
  re-embedding; anything that changes what a vector means joins the hash. The vector lane joins a passage to its row by
  metadata `row` only.
- The vector lane is the driver's (`SearchDriver.fusesVectors`, `SearchRequest.vector`): `SearchIndex` embeds the
  folded words with the caller's `Embedder` (never injected into `Search`, so boot never builds one) and the driver
  applies the same filters and visibility to it as to every other lane.
- Drivers deal in ids and documents; only `SearchIndex`, `SearchableChangeService`, `RelatedChangeService` and `SemanticChangeService` (row loads and populate) touch the ORM. Isolation is the database's: never add a
  scope filter in application code (ADR 0327 d9). The one exception is an engine that keeps its own copy of the
  documents (`SearchDriver.isolatesScopes` false: memory, the Pro engines): each `SearchDocument` carries its row's
  `scope` (from `scopeId`/`scopePath`, never input) and `SearchIndex` passes the session's `app.scope_paths` as
  `SearchRequest.scopePaths`, which the driver must apply to matches and facet counts (ADR 0089 d6). Postgres sets
  `isolatesScopes` true and gets none.
- A versioned rebuild (ADR 0221 d7) is `prepare` → `reindex({ version })` → `swap`, in `reindexSearch` only (the
  `ReindexSearchAction` job of @stackra/data-maintenance, with its `version` input). Between `prepare` and `swap` a
  driver writes and removes in the live index and the version alike; reads never leave the live index before the swap.
  Postgres shadow columns are `<column>__v<n>`, live columns have no suffix, and a live column name never contains
  `__v`; the swap is a contract migration, so `PostgresSearchDriver.swap` only checks.
- A full rebuild runs only as a job: `reindexSearch`, called by `ReindexSearchAction` of @stackra/data-maintenance,
  records its cursor in `search.indexes` through `SearchIndexRegistry`; never loop `SearchIndex.reindex` in a request.
  The registry holds counts and states only, no row data, and has no RLS; only platform code reads it. The CLI reaches
  it through `searchStatus` here and `searchReindex` of @stackra/data-maintenance.
- Declare no action here. A job over this package's work goes in @stackra/data-maintenance, which holds its
  system-held permission; search never depends on it (ADR 0462 decision 1).
- Facet field kinds (stackra-302): any-of filters, ranges and sort keys reach a driver only when its `fieldKinds` is
  true; `SearchIndex` refuses them otherwise, never drops them. Sortable and range values live in `search_filters`
  (`searchDocumentOf`), so the macro writes no column for them; `boost` reaches a driver as `SearchDocument.weights`.
  Every path a document reads comes from `searchPathsOf` (change consumers, relation hops, populate hints); a new
  field kind joins there. `when` is applied in `SearchIndex` only (a refused row is removed, never indexed).
- Ranking rules (stackra-326) are settings data (`search.rankingRules`, line form `SEARCH_RULE_LINE`), read per call
  through `searchRulesOf`; never a code list. They reach only a driver whose `appliesRules` is true. A pin ranks a
  row first only when it passes the same filters, visibility and scope as every lane; never pin around visibility.
- The query log is analytics, never data a read depends on: `SearchIndex` never awaits `SearchQueryLog.record`, the
  bound Postgres driver (`QueuedSearchQueryLogDriver` of @stackra/data-maintenance, over the abstract
  `PostgresSearchQueryLogDriver` here) queues `RecordSearchQueryAction` there, and `search.queries` sits under
  row-level security. A phrase is
  withheld when the facet's text holds a classified field or `searchPhraseWithheld` says it looks personal; add a
  pattern there, never log a raw phrase elsewhere. Sampling is `search.querySample` (off by default).
- Did-you-mean neighbours come from rows the caller may see: a driver applies `visible` and scope to
  `SearchDriver.neighbours` as to a search.
- Record visibility is the one narrowing a search adds, and it goes in before ranking and before facet counting: `SearchIndex` passes
  `visibleKeysQuery`'s subquery as `SearchRequest.visible`, and a driver applies it in every lane or refuses (ADR 0333).
- Snippets read the field's data class: a `no_snippet` field is excerpted only when the caller says the user is on the
  record's team; team membership is IAM's answer, never decided here (ADR 0341).
- `searchWordsOf` and `arabiziOf` are public (`.`): callers fold search text with them, never a copy. The Arabizi
  alternative is on unless a read passes `arabizi: false`; it only adds a spelling, so the switch narrows and never
  widens.
- `SearchQuery(Model)` is the one search API (ADR 0221 d6): gen writes `SearchXQuery extends SearchQuery(X)` per
  `@Searchable` model. Its answer is key, title and snippet only, never the row or a field outside the facet's text;
  it reads through `SearchIndex` only, so visibility stays the database's. A public search changes the actors and the
  area, nothing else.
- `Search.across` filters are per model (`Map<model, filters>`), each checked by that model's `SearchIndex`.
- `VectorIndex` (`search.vector_items`) is the platform's one vector store (ADR 0465): @stackra/ai retrieves and will
  store conversation memory through it, and keeps no vector table of its own. Add a vector need here, not a table.
- `PgvectorVectorIndexDriver` works at the one dimension `search.embedder.dimensions`: it refuses other sizes and
  queries `"embedding"::vector(n)` where `vector_dims("embedding") = n`, the partial HNSW index's exact expression and
  predicate (migration 0004 for 1024). Change the query and the index together; `n` is interpolated only as the checked
  configured integer.
- Raw SQL only in `PostgresSearchDriver`, `PostgresSearchQueryLogDriver` and `PgvectorVectorIndexDriver` (plus the
  registry and the `current_setting` reads of the scope session), every value bound, identifiers quoted, configuration names from
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

| Data           | Where                                           | Handling                                                                                                                                                                         |
| -------------- | ----------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Indexed text   | the model table's search columns, memory driver | Copies of the facet's text fields; `remove` clears them on erasure (@stackra/privacy's `UnindexErasedSubjectListener` calls `SearchForgetService`); ADR 0134 decides the fields  |
| Search phrases | `SearchRequest.words`, `search.queries`         | Bound parameters to the engine; a sampled phrase is logged normalised in `search.queries` under RLS, withheld (null) for a classified text field or a phrase that looks personal |
| Embedder token | `SecretStore` (`search.embedder.tokenSecret`)   | Read at call time by name; never logged, kept or put in an error (ADR 0173)                                                                                                      |
