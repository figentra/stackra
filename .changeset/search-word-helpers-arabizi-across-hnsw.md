---
"@stackra/search": minor
---

Export `searchWordsOf` and `arabiziOf` from `.`, so callers fold search text exactly as the index does. `find`, `page`,
`facets` and `across` take `arabizi: false` to drop the Arabizi spelling for one read. `Search.across` takes
`SearchAcrossOptions`: per-model `filters` (a `Map` from model class to filters), `locale` and `arabizi`.
`PgvectorVectorIndexDriver` now takes `SearchConfig` and works at the fixed `search.embedder.dimensions`: it refuses
vectors of other sizes and queries `"embedding"::vector(n)` among the rows of that dimension, which migration
`search.0004_create_vector_hnsw_index` indexes with HNSW by cosine distance for the default 1024 (STA-1251).
