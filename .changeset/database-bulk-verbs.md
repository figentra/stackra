---
"@stackra/database": minor
---

Bulk verbs and an offset paginator on `CrudService` and `Repository` (stackra-280). `insertMany(rows)` and
`upsert(rows, { by })` write through one flush, so each row is stamped, its encrypted fields sealed and its change
recorded; `upsert` returns the rows with created and updated counts. `updateWhere(where, data)` is one stamped native
statement reported to the change feed (raising `version` on a `Versioned` model), and goes through the unit of work
when it sets an encrypted field. `deleteWhere(where)` follows the delete policy. `each` and `chunk` walk the matching
rows by keyset in batches, and `page({ page, perPage, sort })` reads a numbered page with its total.
