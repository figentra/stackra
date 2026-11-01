---
"@stackra/database": patch
"@stackra/events": patch
---

A model's recorded events reach the testing app after commit (STA-1740). `MemoryDatabaseDriver` and `usePostgres()`
connect `RecordedEventsSubscriber`, which takes each flushed model's recorded events and, once the outermost
transaction commits, hands them to the new `commitEvents` of `@stackra/events/testing`: an integration event to the
app's outbox, any other on its bus, so `run()` results and `app.events.published()` hold them. A rollback publishes
nothing, and a released savepoint's events wait for the transaction around it. `@stackra/database` takes
`@stackra/events` as an optional peer for its testing entry.
