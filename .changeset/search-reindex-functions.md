---
"@stackra/search": minor
---

The reindex jobs and the `searchReindex` runner move to the add-on `@stackra/data-maintenance` (ADR 0462 decision 1),
which holds their system-held permissions. `./node` no longer exports `ReindexSearchAction`, `ReindexSemanticAction`,
`ReindexSearchInput`, `ReindexSearchOutput` or `searchReindex`; it adds `reindexSearch` and `reindexSemantic`, the work
those jobs call. The `@stackra/actions` and `@stackra/queue` dependencies go.
