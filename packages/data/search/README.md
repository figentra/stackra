# @stackra/search

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
| `./contracts` | `SearchDriver`                                                        | the port                                                           |
| `./contracts` | `SearchDocument`, `SearchRequest`, `SearchTable`, `SearchFilterValue` | what a driver stores and is asked                                  |
| `./contracts` | `VectorIndex`, `Embedder`                                             | the vector ports @stackra/ai retrieves through                     |
| `./contracts` | `VectorItem`, `VectorHit`, `VectorQueryOptions`                       | what a vector index stores, returns and is asked                   |
| `./node`      | `PostgresSearchDriver`                                                | the hybrid engine: full-text and trigram, fused by reciprocal rank |
| `./node`      | `PgvectorVectorIndexDriver`                                           | the pgvector `VectorIndex`: cosine distance, scope-filtered        |
| `./node`      | `SearchableMacro`, `SearchableColumns`                                | `t.searchable({ text, filters, locales })` in a migration          |
| `./node`      | `registerSearchableModels`, `SearchableChangeService`                 | automatic indexing from the outbox's row changes (gen's wiring)    |

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
narrows to the rows at or below its `scope`. The embedding column has no fixed dimension, so a query scans the scope's
rows exactly (no HNSW index yet); every passage of one deployment comes from one embedder. `MemoryVectorIndexDriver`
does the same in memory. `HttpEmbedderDriver` (`./node`) calls an OpenAI-compatible `/embeddings` endpoint in the
tenant's region (`search.embedder: { url, model, dimensions, tokenSecret }`; the bearer token is read through the runtime's
`SecretStore` under the `tokenSecret` name, never from the environment), so the text never leaves it; it checks
every vector's size against `dimensions`. Provider-specific drivers live with the AI integrations.

## Visibility, Arabizi, snippets and global search

- `search.in(Product).facets(phrase, { paths: ["status"], filters })` counts each filter value over the rows the same
  search matches, under the same record visibility subquery, so a count never includes a row the viewer cannot see.

- Record visibility (ADR 0333) bounds a search before it ranks: `SearchIndex` hands the driver the subquery of the
  visible keys (`visibleKeysQuery` of `@stackra/database`), which the Postgres driver ANDs into both lanes. The memory
  driver refuses a request that carries one.
- An Arabizi word (`7abibi`) also matches its Arabic spelling (`حبيبي`), as a prefix alternative.
- Synonyms are settings data, edited per scope with no deploy: `search.synonyms` (`SearchSettings`) holds one set per
  line, `<index> <language>: term, term[, term...]`, where the index is the model's table, bare or schema-qualified,
  and `#` starts a comment line:

  ```text
  # living room
  products en: sofa, couch, settee
  catalogue.products ar: كنبة, أريكة
  ```

  A set is an equivalence: each word finds the rows of the others. `find`, `page` and `facets` take `locale` (`ar-SA`),
  and only that language's sets apply; with none, every language's sets apply (`across` passes none). The sets join
  each phrase word as alternatives in both lanes: ORed prefixes in full-text, and in trigram one more phrase per
  alternative (that word swapped), at most eight phrases. A term that normalises to several words is left out, and a
  word carries at most eight synonyms. The setting's schema refuses a line that is not a set, a comment or blank.

- `index.snippets(rows, phrase, { isTeamMember })` excerpts each row's own text fields; a field whose data class says
  `no_snippet` (`PrivilegedDataClass`) is excerpted only for the record's team, which IAM answers.
- `search.across([Customer, Matter], phrase, { limit })` fuses several models' results by reciprocal rank (the
  palette's global search).

## Not here

- Phrase synonyms (`t shirt` for `tee`) and one-way synonyms (`tv => television`): sets are single words and
  equivalences.
- Re-indexing a parent when a related row its facet reads changes: the writer calls `index` for it; `reindex`
  backfills.
- The vector lane in the hybrid `Search` ranking (the `VectorIndex` stands alone for now); the versioned index swap,
  the palette UI and the public search API of ADR 0221 are later work.
- An OpenSearch driver: built behind the same port when ADR 0221 d9's trigger is met.
