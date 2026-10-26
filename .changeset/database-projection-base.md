---
"@stackra/database": minor
---

Add `Projection<Row>({ key })`, the read-model kind base (ADR 0294 decision 16, ADR 0163 decision 1): a binding whose
`put` and `remove` keep one version per write in the new `database.projection_rows` table (migration
`0004_create_projection_rows`, forced ancestor policy), skip a write older than the current version, and whose `get`
and `list` read now or `asOf` a past moment. Adds the types `ProjectionClass`, `ProjectionOptions`,
`ProjectionReadOptions` and `ProjectionRow`.
