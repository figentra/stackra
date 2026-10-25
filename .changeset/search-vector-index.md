---
"@stackra/search": minor
---

Add vector retrieval (owner decision 23): the `VectorIndex` (`upsert`, `query`, `remove`) and `Embedder` (`embed`,
`dimensions`) ports with `VectorItem`, `VectorHit` and `VectorQueryOptions` in `./contracts`, the in-memory
`MemoryVectorIndexDriver` (cosine similarity) in `.`, and `PgvectorVectorIndexDriver` in `./node` over the `Database`
port: pgvector's cosine distance on `search.vector_items`, scope-filtered under row-level security, created by the new
migration `search.0002_create_vector_items`. No `Embedder` driver ships here; provider drivers belong to the AI
integrations.
