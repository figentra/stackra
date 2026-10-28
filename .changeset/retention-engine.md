---
"@stackra/model": minor
"@stackra/database": minor
"@stackra/outbox": minor
---

Retention engine (ADR 0134 decision 3, ADR 0189 decision 4). @stackra/model adds the
`Retention({ keep, basis, policy: "archive" | "soft" | "hard" })` trait. @stackra/database adds `pruneRecords` and the
nightly per-scope `record.prune` job (`PruneRecordsAction`): expired rows are archived, soft-deleted or deleted in
keyset chunks that ask the `HoldRegistry` with `Disposal.Retention`, and every `SoftDeletes` model's rows deleted
more than 30 days ago are purged. @stackra/outbox adds `OutboxDriver.pruneDead`, the `outbox.pruneAfterDays` setting
and the daily `outbox_message.prune` job (`PruneOutboxAction`), which deletes old dead letters and inbox ids.
