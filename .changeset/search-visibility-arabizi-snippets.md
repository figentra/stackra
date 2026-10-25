---
"@stackra/search": minor
---

Apply record visibility before ranking (`SearchRequest.visible`, ANDed into both Postgres lanes), match Arabizi words
by their Arabic spelling (`SearchRequest.alternatives`), add `SearchIndex.snippets` that never excerpts a `no_snippet`
(privileged) field outside the record's team, `Search.across` for a global search over several models, and
`HttpEmbedderDriver` for an in-region OpenAI-compatible embeddings endpoint (`search.embedder`).
