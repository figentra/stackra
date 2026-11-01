---
"@stackra/search": minor
"@stackra/model": minor
---

Add the AI-everywhere retrieval lane of `@stackra/search` (STA-1636, ADR 0492 decisions 4, 5 and 8).

- `Reranker` port with `HttpRerankerDriver` (text-embeddings-inference `/rerank`, token from `SecretStore` at call time,
  `search.reranker`) and `MemoryRerankerDriver`; `runRerankerConformance` in `./testing`. `SearchIndex` reranks the first
  `topN` fused candidates when a read passes `rerank: true` or the model declares `@Searchable({ rerank: true })`
  (new in `@stackra/model`); with no reranker, or when it fails, the fused order stands.
- Arabizi also applies to any Latin word when the read's locale is Arabic (`arabiziOf(word, anyLatin)`).
- Tenant synonyms as data: the `SynonymSource` port with `MemorySynonymSourceDriver`, and query expansion in
  `SearchIndex` (the rows, actions and database driver are `@stackra/data-maintenance`'s, so search stays below iam).
- `Recommender` port (`similar`, `boughtTogether`) with `PostgresRecommenderDriver`, `HttpRecommenderDriver` (the
  `tools-recommend` contract) and `MemoryRecommenderDriver`; `search.recommender` config.
- Evaluation set in `./testing` (catalogue, judged Arabic, English and mixed queries, `ndcgAt`, `recallAt`, thresholds) and
  a `test:int` script that fails when NDCG@10 or recall@50 drops under them.
