---
"@stackra/search": minor
"@stackra/cli": minor
---

Search index registry and reindex jobs (ADR 0404 d3, ADR 0221 d7): `search.indexes` with `SearchIndexState`,
`SearchIndexRegistry` (`list`, `invalidateChanged`, `begin`/`progress`/`finish`), `searchFacetHashOf`, resumable
`SearchIndex.reindex({ after, since, onBatch })`, the `reindexSearch` and `reindexSemantic` work that the reindex jobs
of `@stackra/data-maintenance` run, and the `stackra search:reindex [Model] [--scope-id --scope-path] [--since]
[--semantic]` and `stackra search:status` commands through the member's `searchReindex` (of
`@stackra/data-maintenance/node`) and `searchStatus` runners.
