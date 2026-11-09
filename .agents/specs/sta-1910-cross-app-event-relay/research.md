# Research: cross-app event relay (STA-1910)

## R-1 · Where the fan-out happens

- **Decision**: in `OutboxRelayService.publish`, after the in-app publish, through `CrossAppFanOut`, which writes one
  `outbox.deliveries` row per subscriber.
- **Rationale**: the producer's business transaction stays as it is; the outbox already gives at-least-once with
  retries, and a unique key (event id, subscriber, type) makes a relay retry harmless. The event leaves only from the
  outbox (d12).
- **Alternatives**: writing deliveries in the business transaction (`OutboxWriterService`) couples every write to the
  subscriber configuration; outbox rows per subscriber are impossible because the outbox row id is the event id.

## R-2 · A separate cross-app relay

- **Decision**: `CrossAppRelayService` with its own lock and a fair, per-subscriber tick.
- **Rationale**: the outbox relay delivers a batch in sequence; one slow consumer with a 10-second timeout would hold
  every event of the service. Its own loop sends subscribers in parallel and stops a subscriber at its first failure
  in a tick (SC-005).
- **Alternatives**: a new `MessageKind` in `outbox.messages` (blocked by R-1's id rule); a queue job per delivery
  (adds `@stackra/queue` to every producer and a second retry policy).

## R-3 · Producer identity

- **Decision**: Ed25519 per producer service; private key in the secret store by name; public keys and ids in runway
  config, copied by gen into the manifest's `relay` section, so the pinned contract carries them.
- **Rationale**: the leader's answer to Q1; the consumer holds no secret; trust comes from the registry's trusted
  publisher (ADR 0511 d5); Web Crypto in Node 24 signs and verifies Ed25519 with no dependency.
- **Alternatives**: HMAC per producer and consumer pair (a shared secret on every consumer, N×M rotation); waiting for
  STA-1792 (blocks every cross-repo product). STA-1792 replaces `Ed25519EventSigner` and `ContractInboxVerifier`.

## R-4 · Signature layout without a dependency on `@stackra/webhooks`

- **Decision**: the Standard Webhooks header layout (`webhook-id`, `webhook-timestamp`, `webhook-signature`), signed
  content `<id>.<timestamp>.<body>`, five-minute window, with an asymmetric `v1a,<key id>,<signature>` value; the code
  lives in `@stackra/outbox` and does not import `@stackra/webhooks`.
- **Rationale**: one familiar layout; `runtime/outbox` importing `communication/webhooks` would invert the usual
  direction (webhooks writes into the outbox).
- **Alternatives**: importing the webhook functions (HMAC only, wrong direction); HTTP Message Signatures (RFC 9421;
  more surface than needed).

## R-5 · Subscriber source

- **Decision**: a `SubscriberSource` port; the first driver reads `EventsRelayConfig`, which runway's deploy writes from
  the producer's `runway.yaml` `events.subscribers` per environment.
- **Rationale**: the leader's answer to Q2, with the seam for the Control Plane (draft OS ADR 0078).
- **Alternatives**: reading consumers' contracts (a reverse dependency); push to all and drop at the inbox (wasted
  traffic, leaks event types to consumers that did not ask).

## R-6 · The inbox route and its Encore adapter

- **Decision**: gen emits `InboundEventsController` on `/events/inbox` (as `emitWebhooks` does for `/webhooks/*`) and an
  `api.raw` adapter for it through `answerHttp`, outside session auth.
- **Rationale**: ADR 0294 d16 (a raw endpoint is a `Controller`); no general per-controller Encore adapter exists yet
  (plan finding F-1), so the inbox emits its own.
- **Alternatives**: an action with `auth: false` (would parse the body before verification and become an MCP tool).

## R-7 · Catching a forgotten subscription

- **Decision**: the producer's manifest lists subscriber names and events per environment; the consumer's gen warns
  (`client_event_unsubscribed`) when its pinned producer contract does not list it for an event it listens to.
- **Rationale**: the leader's addition to Q2; no reverse dependency, since the consumer reads the producer's contract it
  already pins.
