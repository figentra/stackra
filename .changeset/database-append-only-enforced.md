---
"@stackra/database": minor
"@stackra/gen": minor
---

`AppendOnly` is enforced (stackra-256). `CrudService` refuses `update`, `increment`, `delete`, `restore` and `repath`
on an append-only model with `AppendOnlyWriteError`; `purge` and `forceDelete` still remove rows for retention and
erasure. `AppendOnlySubscriber` refuses a flush that changes a loaded row, and the generated boot adds it.
`t.appendOnly()` revokes `UPDATE` on the table from `public` and the migrating role, and gen refuses an own
`AppendOnly` model whose table no migration revokes it on (`append_only_not_revoked`).
