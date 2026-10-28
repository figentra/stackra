---
"@stackra/database": minor
"@stackra/model": minor
---

Make the delete policies work: the drivers register the `deleted` and `archived` filters for `SoftDeletes` and the new
`Archivable` trait, `CrudService` gains `delete` (soft delete, archive or hard delete by the model's traits),
`restore` and `forceDelete`, its reads take `withDeleted`/`onlyDeleted`/`withArchived`/`onlyArchived`, `purge`
reaches kept rows, and the blueprint gains `t.archivable()`.
