---
"@stackra/database": patch
---

A `CrudService` read treats an entity manager without `isInTransaction` (a unit test's partial one) as outside a transaction, instead of throwing.
