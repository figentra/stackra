---
"@stackra/search": minor
---

Semantic indexing: `registerSearchableModels` also watches a `@Searchable({ semantic: true })` model with the new
`SemanticChangeService` (`./node`, `Lifetime.Transient`), which embeds the row's text fields through the `Embedder`
and stores the passage in the `VectorIndex` under `<Model>:<key>` in the row's scope. A runtime `ai: never` guard
refuses a text field whose data class says `ai: never` before any text is embedded (STA-1326, ADR 0380).
