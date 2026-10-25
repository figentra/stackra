---
"@stackra/outbox": minor
---

Add `@stackra/outbox`: the transactional outbox, with the ORM flush writer that stores integration events and watched
row changes in the producer's transaction, the relay that publishes them under a lock with backoff retries and dead
letters, inbox deduplication by event id, the `OutboxDriver`, `InboxDriver` and `EventPublisher` ports with memory and
Postgres drivers, the `EventOutbox` driver, `registerEventNames`, `registerChangeConsumers` and `OutboxConfig`.
