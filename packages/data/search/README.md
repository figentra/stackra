# @stackra/search

<!--
Stackra file contract:
Purpose: the reader-facing guide of @stackra/search: entries, searching, indexing, the columns, vector retrieval (the fixed-dimension HNSW index), semantic indexing, visibility, Arabizi and global search, the driver conformance suite, and what is not here.
Boundary: documentation only; the code and the ADRs win on any difference.
Runtime: none
Governing contract: ADR 0221; ADR 0160; ADR 0294; ADR 0404; STA-1251 (word helpers, Arabizi switch, across filters, HNSW); ADR 0380 and STA-1326 (semantic indexing); ADR 0089 d5 and ADR 0461 (conformance suite, Pro drivers).
-->

Stackra search: Postgres hybrid search over a model's `@Searchable` index (ADR 0221). A query injects `Search` and asks
`search.in(Product)` for ranked rows; the index lives in the model's own table, in the columns the `t.searchable(...)`
migration macro writes, so a search runs in the caller's transaction under the same row-level security as the data.
A `VectorIndex` stores embedded passages for semantic retrieval (pgvector in Postgres, ADR 0160). It is the platform's
one vector store (ADR 0465): `@stackra/ai` reads and writes through it and keeps no vector table of its own.

**Tier:** `tier:lib` (`packages/data/search`). Entries `.`, `./contracts`, `./node` and `./testing`. Depends on `@stackra/config`,
`@stackra/container`, `@stackra/contracts`, `@stackra/database`, `@stackra/errors`, `@stackra/model`,
`@stackra/outbox`, `@stackra/settings` and `@stackra/validation`.

## What is here

| Entry         | Symbol                                                                | Use                                                                |
| ------------- | --------------------------------------------------------------------- | ------------------------------------------------------------------ |
| `.`           | `Search`                                                              | the injected reader: `search.in(Model)`                            |
| `.`           | `SearchIndex`, `SearchFindOptions`, `SearchPageOptions`               | one model's index: `find`, `page`, `index`, `remove`, `reindex`    |
| `.`           | `MemorySearchDriver`                                                  | the in-process engine (tests, the dev lane)                        |
| `.`           | `MemoryVectorIndexDriver`                                             | the in-process `VectorIndex` (tests, the dev lane)                 |
| `.`           | `SearchConfig`, `SearchConfig$`, `SearchOptions`                      | `search.driver`: `postgres` (default) or `memory`                  |
| `.`           | `SearchSettings`                                                      | `search.synonyms`: synonym sets per index and language (settings)  |
| `.`           | `SearchCursorInvalidError`                                            | refusal of a cursor no page gave (`search_cursor_invalid`, 400)    |
| `.`           | `searchWordsOf`, `arabiziOf`                                          | the index's one normalisation, and an Arabizi word's Arabic form   |
| `.`           | `SearchAcrossOptions`                                                 | `across`'s limit, per-model filters, locale and Arabizi switch     |
| `./contracts` | `SearchDriver`                                                        | the port                                                           |
| `./contracts` | `SearchDocument`, `SearchRequest`, `SearchTable`, `SearchFilterValue` | what a driver stores and is asked                                  |
| `./contracts` | `VectorIndex`, `Embedder`                                             | the vector ports @stackra/ai retrieves through                     |
| `./contracts` | `VectorItem`, `VectorHit`, `VectorQueryOptions`                       | what a vector index stores, returns and is asked                   |
| `./node`      | `PostgresSearchDriver`                                                | the hybrid engine: full-text and trigram, fused by reciprocal rank |
| `./node`      | `PgvectorVectorIndexDriver`                                           | the pgvector `VectorIndex`: cosine distance, scope-filtered        |
| `./node`      | `SearchableMacro`, `SearchableColumns`                                | `t.searchable({ text, filters, locales })` in a migration          |
| `./node`      | `registerSearchableModels`, `SearchableChangeService`                 | automatic indexing from the outbox's row changes (gen's wiring)    |
| `./node`      | `RelatedChangeService`                                                | re-indexes the parents of a changed related row                    |
| `./node`      | `SemanticChangeService`                                               | embeds a `semantic: true` model's text into the `VectorIndex`      |
| `./testing`   | `runSearchConformance`, `SEARCH_CONFORMANCE_CASES`                    | the `SearchDriver` conformance suite every driver passes           |
| `./testing`   | `SEARCH_CONFORMANCE_DOCUMENTS`, `searchConformanceTable`              | the seed documents and the per-case table a fixture keys on        |

## Searching

```ts
export class SearchProductsQuery extends Query({ key: "product.search" }) {
  constructor(search: Search) {
    super();
    this.search = search;
  }

  async handle(input: SearchProductsInput): Promise<ProductPage> {
    const page = await this.search.in(Product).page(input.q, {
      filters: { status: ProductStatus.Active },
      cursor: input.cursor,
      limit: input.limit,
      populate: ["variants"],
    });
    return ProductPage.create(page);
  }
}
```

- `find(phrase, options)` returns up to `limit` loaded rows, best first; `page(phrase, options)` adds `hasMore` and
  `nextCursor`. `limit` is 1 to 100 (default 20). A filter key must be one of the facet's `filters`; a filter value is
  compared exactly.
- Every word of the phrase must match. The phrase and the documents share one normalisation: lower case, accents and
  Arabic diacritics removed, hamza forms, alef wasla, alef maqsura and teh marbuta unified.
- The rows are loaded through the ORM after ranking, so a row the session cannot see is never returned.

## Keeping the index current

```ts
await this.search.in(Product).index([product]); // after a write, in the same transaction
await this.search.in(Product).remove([product.id]); // erasure
await database.withScope(scope, () => search.in(Product).reindex()); // the backfill, per scope
```

A document holds each text field's words (a translated field per locale; relation paths such as `variants.sku` read
the populated relation) and each filter field's values. `index` populates the relations the facet's paths walk.

Gen's wiring calls `registerSearchableModels([Product, Article])` for a service's `@Searchable` models: from then on
every committed row change reaches `SearchableChangeService` through `@stackra/outbox`, which loads the row in its scope
and indexes it, or removes its document when the row is deleted or no longer visible. Delivery is at least once and
idempotent. The relay hands it each run of one model's changes at once (`consumeMany`): one `$in` load and one
`index` call, and an update that writes none of the facet's fields (nor `deletedAt`, `archivedAt`, `scopeId`,
`scopePath`) is skipped.

A dotted path (`variants.sku`) reaches a related model: `registerSearchableModels` reads each relation hop from the
facet and the relation decorators (`searchRelationsOf`) and watches the related model with `RelatedChangeService`. A
committed `Variant` change then finds its `Product`s through the relation path (`{ variants: { $in: ids } }`, under
row-level security) and re-indexes them in one call. An update of a field the parent does not read, other than a
relation field, is skipped. A deleted one-to-many child no longer joins to its parent, so that parent is refreshed by
its own next change or a reindex; the parent's semantic passages are not re-embedded from a child change.

## The columns

```ts
// a migration, after the model gained @Searchable
schema.table("products", (t: Blueprint) => {
  t.searchable({ text: ["title", "variants.sku"], filters: ["status"], locales: ["en", "ar"] });
});
// its index migration, after Migrations.search.createTextFunctions
schema.table("products", (t: Blueprint) => {
  t.index(["search_vector_en"]).using("gin").concurrently();
  t.index(["search_vector_ar"]).using("gin").concurrently();
});
schema.sql(
  "CREATE INDEX CONCURRENTLY idx_products_search_text_trgm ON catalogue.products " +
    "USING gin (search.fold(search_text) gin_trgm_ops)",
  { inverse: "DROP INDEX CONCURRENTLY IF EXISTS catalogue.idx_products_search_text_trgm" },
);
```

`t.searchable` writes `search_vector` (or one `search_vector_<locale>` per locale, stemmed with that language's Postgres
configuration, `arabic` and `english` included), `search_text` and `search_filters`, all nullable and commented. It
writes no index: the migration declares its own. This package's migration `search.0001_create_text_functions` creates
the trigram extension and `search.unaccent_immutable(text)`; `search.0003_create_fold_function` creates `search.fold(text)`,
the SQL mirror of `searchWordsOf` (Arabic folded as `@stackra/i18n`'s `normalizeArabic` folds it, article included), which
the driver's trigram lane calls. A model built on `unaccent_immutable` adds the `search.fold` index beside the old one,
drops the old one, then runs `search.in(Model).reindex()` (ADR 0404).

## Vector retrieval

```ts
const vectors = await embedder.embed(chunks.map((chunk) => chunk.text));
await index.upsert(
  chunks.map((chunk, at) => ({
    id: chunk.id,
    scope,
    vector: vectors[at] ?? [],
    text: chunk.text,
    metadata: { source: doc.id },
  })),
);
const [query] = await embedder.embed([question]);
// best first, each with its cosine score
const hits = await index.query(query ?? [], { topK: 5, scope, filter: { source: doc.id } });
```

`VectorIndex` (`upsert`, `query`, `remove`) and `Embedder` (`embed`, `dimensions`) are the ports in `./contracts`.
`PgvectorVectorIndexDriver` keeps passages in `search.vector_items` (migration `search.0002_create_vector_items`: the
`vector` and `ltree` extensions, the table under the forced scope policy). It runs in the caller's transaction and scope
session (`Database.withScope`), so row-level security limits every read and write to the granted scopes; a query also
narrows to the rows at or below its `scope`. The driver works at one fixed dimension, `search.embedder.dimensions`: it
refuses a vector of any other size, stores `vector(n)` and queries `"embedding"::vector(n)` among the rows of that
dimension, which is the expression and predicate of a partial HNSW index by cosine distance. Migration
`search.0004_create_vector_hnsw_index` ships that index for the default 1024; a deployment whose embedder returns
another size adds the same statement at its `n` in its own migration (pgvector indexes up to 2000 dimensions):

```ts
schema.sql(
  `create index if not exists "vector_items_embedding_hnsw_768" on "search"."vector_items" using hnsw (("embedding"::vector(768)) vector_cosine_ops) where vector_dims("embedding") = 768`,
  { inverse: `drop index if exists "search"."vector_items_embedding_hnsw_768"` },
);
```

HNSW filters after the scan, so a narrow scope or metadata filter can return fewer than `topK`; pgvector's
`hnsw.iterative_scan` is the fix when a deployment sees it. Every passage of one deployment comes from one embedder. `MemoryVectorIndexDriver`
does the same in memory. `HttpEmbedderDriver` (`./node`) calls an OpenAI-compatible `/embeddings` endpoint in the
tenant's region (`search.embedder: { url, model, dimensions, tokenSecret }`; the bearer token is read through the runtime's
`SecretStore` under the `tokenSecret` name, never from the environment), so the text never leaves it; it checks
every vector's size against `dimensions`. Provider-specific drivers live with the AI integrations.

## Semantic indexing

`@Searchable({ text: ["subject", "body"], semantic: true })` also embeds the text fields. `registerSearchableModels`
then watches the model's rows with `SemanticChangeService` too: each committed change loads the row, joins its text
fields (the same normalised words as the lexical document, every locale of a translated field) into one passage,
embeds it through the `Embedder` and stores it in the `VectorIndex` as `<Model>:<primary key>`, with metadata
`{ source: "search", model }`, in the row's own scope (`scopeId`, `scopePath`). A deleted row, one the session no longer
sees and one with no text lose their passage. A backfill calls `index(Model, rows)` on the service per batch.

The `ai: never` floor (ADR 0380) holds twice: gen refuses `searchable_semantic_ai_never` when a text path ends at a field
whose data class says `ai: never`, and the service refuses the same at index time, on the loaded row and through its
relations, before any text reaches the embedder. The service is `Lifetime.Transient`, so a deployment with no
semantic model never builds it, nor the `HttpEmbedderDriver` that needs `search.embedder.url`.

## Visibility, Arabizi, snippets and global search

- `search.in(Product).facets(phrase, { paths: ["status"], filters })` counts each filter value over the rows the same
  search matches, under the same record visibility subquery, so a count never includes a row the viewer cannot see.

- Record visibility (ADR 0333) bounds a search before it ranks: `SearchIndex` hands the driver the subquery of the
  visible keys (`visibleKeysQuery` of `@stackra/database`), which the Postgres driver ANDs into both lanes. The memory
  driver refuses a request that carries one.
- An Arabizi word (`7abibi`) also matches its Arabic spelling (`حبيبي`), as a prefix alternative. `find`, `page`,
  `facets` and `across` take `arabizi: false` to turn that off for one read (a code field, an English-only list).
- `searchWordsOf(text)` and `arabiziOf(word)` are exported, so a caller that stores or compares search text folds it
  exactly as the index does, never with its own copy.
- Synonyms are settings data, edited per scope with no deploy: `search.synonyms` (`SearchSettings`) holds one set per
  line, `<index> <language>: term, term[, term...]`, where the index is the model's table, bare or schema-qualified,
  and `#` starts a comment line:

  ```text
  # living room
  products en: sofa, couch, settee
  catalogue.products ar: كنبة, أريكة
  ```

  A set is an equivalence: each word finds the rows of the others. `find`, `page` and `facets` take `locale` (`ar-SA`),
  and only that language's sets apply; with none, every language's sets apply (`across` passes its `locale`). The sets join
  each phrase word as alternatives in both lanes: ORed prefixes in full-text, and in trigram one more phrase per
  alternative (that word swapped), at most eight phrases. A term that normalises to several words is left out, and a
  word carries at most eight synonyms. The setting's schema refuses a line that is not a set, a comment or blank.

- `index.snippets(rows, phrase, { isTeamMember })` excerpts each row's own text fields; a field whose data class says
  `no_snippet` (`PrivilegedDataClass`) is excerpted only for the record's team, which IAM answers.
- `search.across([Customer, Matter], phrase, { limit, filters, locale, arabizi })` fuses several models' results by
  reciprocal rank (the palette's global search). `filters` is a `Map` from a model class to its own filters
  (`new Map([[Product, { status: ProductStatus.Active }]])`), since each model lists its own filter paths; a model with
  no entry is read unfiltered.

## Index registry and reindex jobs

`search.indexes` (migration `search.0005_create_search_indexes`) keeps one row per model and scope: its state
(`SearchIndexState`: `valid`, `invalid`, `rebuilding`), the SHA-256 of the `@Searchable` facet its last rebuild used
(`searchFacetHashOf`), its document count, the cursor a stopped rebuild resumes after, and when it was last rebuilt.
`SearchIndexRegistry` (`./node`) reads and writes it: `list()`, `invalidateChanged(models)` (call it at boot: an index
whose facet changed turns `invalid`), and `begin`/`progress`/`finish` for a run.

Rebuilds run as jobs (ADR 0404 d3), queued by `stackra search:reindex` (the `searchReindex` runner) or by code:

- `ReindexSearchAction` rebuilds one model (every registered model when none is named) in the job's scope, in batches
  of 500 through `SearchIndex.reindex({ after, onBatch })`, recording each batch's cursor; a stopped run resumes after
  it when the facet is unchanged. `since` (ISO 8601) indexes only rows updated since then and leaves the registry alone.
- `ReindexSemanticAction` backfills the vector passages of the semantic models through `SemanticChangeService.index`.
  It is its own job so a service without an embedder never builds one for a plain reindex.

`stackra search:status` (the `searchStatus` runner) prints the registry.

## Scopes on engines outside the database

Postgres keeps the index in the model's own table, so row-level security isolates scopes and `PostgresSearchDriver`
declares `isolatesScopes: true`. An engine that keeps its own copy (memory, the Pro Meilisearch and OpenSearch drivers)
cannot rely on that: every `SearchDocument` carries its row's `scope` (`scopeId` and `scopePath`, never input), and
`SearchIndex` adds the session's granted paths (`current_setting('app.scope_paths')`) to every ranked read and facet
count as `SearchRequest.scopePaths`. The driver answers only documents whose scope path is one of them or below one
(and unscoped documents), so pages, `hasMore`, facet counts and the existence of a match never cross scopes (ADR 0089
d6). Outside a scope session no paths are passed (a platform read); an empty grant passes `[]`, which admits no scoped
document.

## Driver conformance

Every `SearchDriver` passes one suite (ADR 0089 d5), published from `./testing` so a driver outside this package,
the Pro Meilisearch and OpenSearch drivers included (ADR 0461), runs the same rules:

```ts
import { runSearchConformance } from "@stackra/search/testing";

const results = await runSearchConformance(() => new MemorySearchDriver());
expect(results.flatMap((result) => result.mismatches)).toEqual([]);
```

Each case gets a fresh driver and its own table (`conformance_<case>`), seeded with `SEARCH_CONFORMANCE_DOCUMENTS`,
and checks one rule: every word required, word prefixes, alternatives, exact filters, offset and limit, facet counts
(with and without words), re-indexing replaces, removal (an unknown id included), refusing `visible` unless the
driver says `appliesVisibility: true`, and scope isolation (`scope.isolated`, `facets.scoped`): a request's
`scopePaths` admits only documents of those scopes or below them, plus unscoped ones. A driver whose
`isolatesScopes` is true (Postgres, under row-level security) passes the scope cases by declaration; its isolation is
the RLS suite's. Ranking between matches is the engine's, so cases compare id sets. The suite
uses no test framework and never throws for a miss: a thrown error becomes that case's mismatch.

## Health check

`SearchHealthIndicatorDriver` (`.`) is this package's `HealthIndicator` driver, named `search`: it searches `health.table` for one id with no words. Bind it and
`@stackra/app`'s `/readyz` runs it with the other bound indicators. `health` in this package's config tunes it:

| Field        | Default | Meaning                                                                              |
| ------------ | ------- | ------------------------------------------------------------------------------------ |
| `timeout`    | `PT2S`  | How long the probe may take before it counts as failed.                              |
| `critical`   | `true`  | A failed probe is `down` and fails `/readyz`; `false` reports `degraded`.            |
| `table`      | `""`    | The table the probe searches, `schema.table` or `table`; empty refuses to construct. |
| `primaryKey` | `id`    | That table's primary key column.                                                     |

A failed probe never throws; its detail names the error type only.

## Not here

- Phrase synonyms (`t shirt` for `tee`) and one-way synonyms (`tv => television`): sets are single words and
  equivalences.
- Re-indexing a parent after a related one-to-many row is deleted, and re-embedding a semantic parent after a related
  row changes: the parent's own next change or `reindex` does it.
- The vector lane in the hybrid `Search` ranking (the `VectorIndex` stands alone for now); the versioned index swap,
  the palette UI and the public search API of ADR 0221 are later work.
- Meilisearch and OpenSearch drivers: Pro (`@stackra-pro/search-meilisearch`, `@stackra-pro/search-opensearch`,
  ADR 0461); this package never imports them, and `search.driver` names only `postgres` and `memory`.
- Semantic querying: `Search` ranks lexically only; reading the semantic passages back (a vector lane in `find`) is
  later work. `SearchIndex.reindex` does not embed; a backfill calls `SemanticChangeService.index`.
- `ai: tenant_opt_in` fields are embedded like any other text: the guard refuses `never` only, and the scope's opt-in
  is not read here.
- A semantic model's rows need the `scopeId` and `scopePath` columns; one without them is refused at index time.
