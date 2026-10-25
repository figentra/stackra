---
"@stackra/outbox": minor
---

Add the `broker` EventPublisher driver over @stackra/queue's `BrokerPublisher`, and the Postgres stores of the offline
queue (`PostgresDeviceSequenceStoreDriver`, `PostgresOfflineCapStoreDriver`, `PostgresReplicaLogDriver` scoped by the
caller's scope path) with migration `outbox.0003_create_offline_stores`.
