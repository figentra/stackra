---
"@stackra/outbox": minor
"@stackra/model": minor
"@stackra/database": minor
"@stackra/gen": minor
---

Outbox change feed (ADR 0078 and 0221, amended 2026-10-28). Row changes go to a retained, day-partitioned
`outbox.changes` log (migration `outbox.0004_create_changes`) instead of being deleted on delivery; each change
consumer reads it from its own cursor (`outbox.change_cursors`), with backoff and a stall that drops nothing.
`RowChange` gains opt-in `before`/`after` values (the new `CapturesChanges({ values, exclude })` trait and
`changeCaptureOf` in @stackra/model drop encrypted and `@Classified` fields). New: the `ChangeFeed` port with memory
and Postgres drivers, `ChangeFeedService` (`replay`, `resume`, `backfill`), `ChangeFeed.maintain` (run daily by
`data_maintenance.change_log.maintain`) and
`outbox.changeRetentionDays`, `ChangeConsumer.consumeMany` with `coalesceChanges`, and the `@ConsumesChanges(Model)`
facet, which gen turns into `registerChangeConsumers` rows. @stackra/database adds `NativeWriteWatcher` and
`connectNativeWriteWatcher`, so `CrudService`'s native verbs report their rows to the feed.
