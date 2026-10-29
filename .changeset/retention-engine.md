---
"@stackra/model": minor
"@stackra/database": minor
"@stackra/outbox": minor
---

Retention engine (ADR 0134 decision 3, ADR 0189 decision 4). @stackra/model adds the
`Retention({ keep, basis, policy: "archive" | "soft" | "hard" })` trait. @stackra/database adds `pruneRecords` and
`pruneAllRecords`, which the nightly per-scope `data_maintenance.record.prune` job of `@stackra/data-maintenance` runs:
expired rows are archived, soft-deleted or deleted in
keyset chunks that ask the `HoldRegistry` with `Disposal.Retention`, and every `SoftDeletes` model's rows deleted
more than 30 days ago are purged. @stackra/outbox adds `OutboxDriver.pruneDead`, the `outbox.pruneAfterDays` setting
and `pruneOutbox`, which the daily `data_maintenance.outbox_message.prune` job runs to delete old dead letters and
inbox ids.
