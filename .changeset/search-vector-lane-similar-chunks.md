---
"@stackra/search": minor
---

Fuse the vector lane into search (ADR 0221 d1, stackra-301). `SearchRequest.vector` (`SearchVector`) carries a query
embedding to a driver that sets `SearchDriver.fusesVectors`; `PostgresSearchDriver` ranks it as a third reciprocal-rank
lane over `search.vector_items` under the same filters and visibility, or alone. `SearchIndex.find`/`page` take an
`embedder` for a hybrid read of a `semantic: true` model, and `SearchIndex.similar(phrase, { embedder })` is the
semantic read. `SemanticChangeService` now chunks long text (`search.embedder.passageCharacters`/`passageOverlap`),
stores `row` and a content `hash` in each passage's metadata and skips re-embedding an unchanged passage through the
new `VectorIndex.metadataOf` (default: none known). `passageIdsOf` lists every chunk id; `SearchForgetService` removes
them all. `SemanticChangeService` takes `SearchConfig` as a fourth constructor parameter.
