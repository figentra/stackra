# @stackra/search

Stackra search: Postgres hybrid search over a model's `@Searchable` index (ADR 0221). A query injects `Search` and asks
`search.in(Product)` for ranked rows; the index lives in the model's own table, in the columns the `t.searchable(...)`
migration macro writes, so a search runs in the caller's transaction under the same row-level security as the data.

**Tier:** `tier:lib` (`packages/data/search`). Entries `.`, `./contracts` and `./node`. Depends on `@stackra/config`,
`@stackra/container`, `@stackra/contracts`, `@stackra/database`, `@stackra/errors`, `@stackra/model`,
`@stackra/outbox` and `@stackra/validation`.

## What is here

| Entry         | Symbol                                                                | Use                                                                |
| ------------- | --------------------------------------------------------------------- | ------------------------------------------------------------------ |
| `.`           | `Search`                                                              | the injected reader: `search.in(Model)`                            |
| `.`           | `SearchIndex`, `SearchFindOptions`, `SearchPageOptions`               | one model's index: `find`, `page`, `index`, `remove`, `reindex`    |
| `.`           | `MemorySearchDriver`                                                  | the in-process engine (tests, the dev lane)                        |
| `.`           | `SearchConfig`, `SearchConfig$`, `SearchOptions`                      | `search.driver`: `postgres` (default) or `memory`                  |
| `.`           | `SearchCursorInvalidError`                                            | refusal of a cursor no page gave (`search_cursor_invalid`, 400)    |
| `./contracts` | `SearchDriver`                                                        | the port                                                           |
| `./contracts` | `SearchDocument`, `SearchRequest`, `SearchTable`, `SearchFilterValue` | what a driver stores and is asked                                  |
| `./node`      | `PostgresSearchDriver`                                                | the hybrid engine: full-text and trigram, fused by reciprocal rank |
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
    "USING gin (search.unaccent_immutable(search_text) gin_trgm_ops)",
  { inverse: "DROP INDEX CONCURRENTLY IF EXISTS catalogue.idx_products_search_text_trgm" },
);
```

`t.searchable` writes `search_vector` (or one `search_vector_<locale>` per locale, stemmed with that language's Postgres
configuration, `arabic` and `english` included), `search_text` and `search_filters`, all nullable and commented. It
writes no index: the migration declares its own. This package's migration `search.0001_create_text_functions` creates
the trigram extension and `search.unaccent_immutable(text)`.

## Not here

- Re-indexing a parent when a related row its facet reads changes: the writer calls `index` for it; `reindex`
  backfills.
- The vector lane (pgvector) waits for an embedding port; the versioned index swap, the palette, the public search API
  and the IAM predicate of ADR 0221 are later work.
- An OpenSearch driver: built behind the same port when ADR 0221 d9's trigger is met.
