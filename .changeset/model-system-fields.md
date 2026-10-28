---
"@stackra/model": minor
"@stackra/database": minor
---

System fields and validation on flush (stackra-287). `@stackra/model` adds `SYSTEM_FIELDS` (the system-written
fields by trait), the `SystemField` type, `systemFieldsOf(model)` and the `ValidateOnFlush` trait. `CrudService`
`create`, `insert`, `insertMany`, `upsert`, `update` and `updateWhere` refuse data that sets one of the model's system
fields with `SystemFieldWriteError` (a create may still mint its id). `ValidateOnFlushSubscriber` checks each written
row of a `ValidateOnFlush` model against its generated schema and refuses the flush with `ModelInvalidError`.
