---
"@stackra/search": minor
---

Add `@stackra/search`: the `SearchDriver` port, the `Search` reader over a model's `@Searchable` index (ranked `find`
and cursor `page`, `index`, `remove`, `reindex`), the memory driver, the Postgres hybrid driver (full-text and
trigram fused by reciprocal rank, Arabic normalisation), the `t.searchable(...)` migration macro, the text-function
migration and `SearchConfig`.
