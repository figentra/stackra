---
"@stackra/outbox": minor
---

The cross-app event relay (ADR 0511 decisions 11 to 19, STA-1910). After the outbox relay publishes an event in its own
app, a bound `CrossAppFanOutService` writes one delivery per subscriber in another app (migration 0005,
`outbox.deliveries`); `CrossAppRelayService` sends each as one Ed25519-signed POST to the subscriber's
`/events/inbox`, fair across subscribers, retried with the outbox backoff and dead-lettered, with `list` and `replay`
for operators. On the consumer side, `RelayInboxService` verifies the sender against the keys its pinned producers'
contracts list (`registerProducerKeys`) before it reads the body, sets `producer` from that contract, and hands the
envelope to `InboxService`, which runs each event id once. New ports: `SubscriberSource`, `DeliveryDriver`,
`EventSigner`, `InboxVerifier`, `DeliveryTransport`, each with its driver; new configuration `CrossAppConfig`
(`outbox.cross_app`: environment, key id, subscribers, and the `STACKRA_EVENTS_SIGNING_KEY` secret). A service with
no subscribers and no pinned producer behaves as before.
