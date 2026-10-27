# @stackra/search

<!--
Stackra file contract:
Purpose: the reader-facing guide of @stackra/search: entries, searching, indexing, the columns, vector retrieval (the fixed-dimension HNSW index), semantic indexing, visibility, Arabizi and global search, and what is not here.
Boundary: documentation only; the code and the ADRs win on any difference.
Runtime: none
Governing contract: ADR 0221; ADR 0160; ADR 0294; ADR 0404; STA-1251 (word helpers, Arabizi switch, across filters, HNSW); ADR 0380 and STA-1326 (semantic indexing).
-->

Stackra search: Postgres hybrid search over a model's `@Searchable` index (ADR 0221). A query injects `Search` and asks
`search.in(Product)` for ranked rows; the index lives in the model's own table, in the columns the `t.searchable(...)`
migration macro writes, so a search runs in the caller's transaction under the same row-level security as the data.
A `VectorIndex` stores embedded passages for semantic retrieval (pgvector in Postgres, ADR 0160).

**Tier:** `tier:lib` (`packages/data/search`). Entries `.`, `./contracts` and `./node`. Depends on `@stackra/config`,
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
| `./node`      | `SemanticChangeService`                                               | embeds a `semantic: true` model's text into the `VectorIndex`      |

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
idempotent. A change of a related model a dotted path reads (`variants.sku`) does not re-index the parent: its writer
still calls `index`.

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

## Not here

- Phrase synonyms (`t shirt` for `tee`) and one-way synonyms (`tv => television`): sets are single words and
  equivalences.
- Re-indexing a parent when a related row its facet reads changes: the writer calls `index` for it; `reindex`
  backfills.
- The vector lane in the hybrid `Search` ranking (the `VectorIndex` stands alone for now); the versioned index swap,
  the palette UI and the public search API of ADR 0221 are later work.
- An OpenSearch driver: built behind the same port when ADR 0221 d9's trigger is met.
- Semantic querying: `Search` ranks lexically only; reading the semantic passages back (a vector lane in `find`) is
  later work. `SearchIndex.reindex` does not embed; a backfill calls `SemanticChangeService.index`.
- `ai: tenant_opt_in` fields are embedded like any other text: the guard refuses `never` only, and the scope's opt-in
  is not read here.
- A semantic model's rows need the `scopeId` and `scopePath` columns; one without them is refused at index time.
