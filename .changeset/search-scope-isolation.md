---
"@stackra/search": minor
---

Scope isolation for engines outside the database (ADR 0089 d6): `SearchDocument.scope` from the row's own
`scopeId`/`scopePath`, `SearchRequest.scopePaths` from the session's `app.scope_paths`, `SearchDriver.isolatesScopes`
(true for Postgres, under row-level security), the memory driver filters matches and facet counts by scope, and the
conformance cases `scope.isolated` and `facets.scoped`.
