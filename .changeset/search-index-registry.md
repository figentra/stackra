---
"@stackra/search": minor
"@stackra/cli": minor
---

Search index registry and reindex jobs (ADR 0404 d3, ADR 0221 d7): `search.indexes` with `SearchIndexState`,
`SearchIndexRegistry` (`list`, `invalidateChanged`, `begin`/`progress`/`finish`), `searchFacetHashOf`, resumable
`SearchIndex.reindex({ after, since, onBatch })`, the `ReindexSearchAction` and `ReindexSemanticAction` jobs, and the
`stackra search:reindex [Model] [--scope-id --scope-path] [--since] [--semantic]` and `stackra search:status`
commands through the member's `searchReindex`/`searchStatus` runner.
