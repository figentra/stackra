---
"@stackra/ai": minor
---

Add `retrieve(query, { index, embedder, topK, scope })`, the retrieval helper for `Facts`: it embeds the query with the
`Embedder`, asks the `VectorIndex` (both from `@stackra/search/contracts`) for the top-k hits in the caller's scope and
returns `RetrievedPassage`s (text, source id, score) for `provide` to return. Adds the `@stackra/search` dependency.
