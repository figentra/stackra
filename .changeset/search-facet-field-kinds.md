---
"@stackra/model": minor
"@stackra/search": minor
---

Search facet field kinds (data-layer gap se9). `@Searchable` gains `sortable`, `ranges`, `boost` (a text field's
weight letter) and `when` (the values a field must hold for a row to be searchable). `find`, `page` and `facets` take
a list as a filter value (any of them), `ranges` with `gte`/`gt`/`lte`/`lt` bounds, and `find`/`page` take up to three
`sort` keys before relevance. The `SearchDriver` port gains `fieldKinds` and the request `anyOf`, `ranges` and `sort`;
the memory and Postgres drivers apply them, and the conformance suite adds `filters.any-of`, `filters.range` and
`sort.by-field`.
