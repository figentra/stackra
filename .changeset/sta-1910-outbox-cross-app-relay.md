---
"@stackra/outbox": minor
---

Cross-app event relay (STA-1910, ADR 0511 decisions 11 to 19). After the outbox relay publishes an event in its own
app, a bound `CrossAppFanOut` writes one `outbox.deliveries` row (migration `outbox.0005_create_deliveries`) per
subscriber in another app whose events include each published version; `CrossAppRelayService` sends them under its own
lock as Ed25519-signed `POST /events/inbox` requests (Standard Webhooks headers, `v1a,<key id>,<signature>`), fair per
subscriber, with the outbox's backoff and dead letters. On the consumer, `RelayInboxService` verifies the signature
with `ContractInboxVerifierDriver` before parsing, sets `producer` from the verified sender and hands the envelope to
`InboxService`, answering 204, 401 or 422. New ports `DeliveryDriver`, `SubscriberSource`, `EventSigner` and
`InboxVerifier` with memory, Postgres, config, Ed25519 and contract drivers, and the operator commands
`outbox:relay-deliveries` and `outbox:relay-replay`. A service with no relay configuration behaves as before.
