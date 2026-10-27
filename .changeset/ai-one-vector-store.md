---
"@stackra/ai": minor
---

One vector store (ADR 0465): the `Embedding` model is removed from `./node` and migration `ai.0002_drop_embeddings`
drops `ai.embeddings`. Embeddings live in `search.vector_items` behind `VectorIndex` of `@stackra/search`, which
`retrieve()` already reads; conversation memory stores through it with its ids, embedder and content hash as metadata.
Nothing wrote the old table, so no data moves.
