---
"@stackra/search": minor
"@stackra/gen": minor
---

Search parent invalidation and a facet drift check (data-layer gaps se3, se4, se10). `registerSearchableModels` now
also watches every model a dotted `@Searchable` path walks to (`variants.sku`) with the new `RelatedChangeService`,
which finds the parent rows through the relation path and re-indexes them, so their documents no longer go stale.
`SearchableChangeService` gains `consumeMany` (one `$in` load and one `index` call per run), and both consumers skip
an update that writes no field the document reads. Gen refuses `searchable_columns_drift` when a model's
`@Searchable` text or filters differ from the latest `t.searchable` literals of its table.
