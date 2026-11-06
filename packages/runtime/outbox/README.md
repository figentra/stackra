# @stackra/outbox

<!--
Stackra file contract:
Purpose: the package's reader guide: the transactional outbox, its relay, the inbox and the drivers.
Boundary: documentation only; the code and the ADRs win on any difference.
Runtime: none
Governing contract: ADR 0078; ADR 0221 (both amended 2026-10-28: the change feed); ADR 0148; owner D10 2026-10-28 (stackra-223: one RetryPolicy, backoffDelay and Duration).
-->

Stackra outbox: the answer to "must another service learn of a committed change, even if this process dies after the
commit?" (ADR 0078). Integration events, and the row changes of watched models, are written in the same transaction as
the change: events to an outbox table a relay publishes after the commit (one relay per service under a lock, with
backoff retries and dead letters), row changes to a retained, day-partitioned change log each consumer reads from its
own cursor; the inbox runs each received event once.

**Tier:** `tier:lib` (`packages/runtime/outbox`). Entries `.`, `./contracts` and `./node`. Depends on
`@stackra/actions`, `@stackra/config`, `@stackra/container`, `@stackra/contracts`, `@stackra/database`,
`@stackra/errors`, `@stackra/events`, `@stackra/locking`, `@stackra/model`, `@stackra/queue`, `@stackra/validation`,
`@stackra/versioning` and zod.

## What is here

| Symbol                                                                 | Entry         | Use                                                                            |
| ---------------------------------------------------------------------- | ------------- | ------------------------------------------------------------------------------ |
| `OutboxWriterService`                                                  | `./node`      | the ORM flush writer, passed as one of `DatabaseOptions.subscribers`           |
| `OutboxRelayService`                                                   | `./node`      | `connect(container)`, then `work({ signal })` or one `relay()` tick            |
| `InboxService`                                                         | `./node`      | `receive(envelope)` runs an event's listeners and relays once; `prune(before)` |
| `InboxService#connect`                                                 | `./node`      | `connect(container)` resolves the registered relays; `disconnect()` drops them |
| `InboxEventPublisherDriver`                                            | `./node`      | the in-process `EventPublisher`: publishes into this service's inbox           |
| `PostgresOutboxDriver`, `PostgresInboxDriver`                          | `./node`      | the default stores: `outbox.messages` and `outbox.inbox`                       |
| `PostgresChangeFeedDriver`                                             | `./node`      | the default change log: `outbox.changes` and `outbox.change_cursors`           |
| `ChangeFeedService`                                                    | `./node`      | `replay(Consumer, from?)`, `resume(Consumer)`, `backfill(consumer, Model)`     |
| `pruneOutbox`                                                          | `.`           | dead letters and inbox ids past `pruneAfterDays`; the daily job calls it       |
| `OutboxEventOutboxDriver`                                              | `.`           | the driver of @stackra/events' `EventOutbox` port                              |
| `registerEventNames`                                                   | `.`           | re-exported from @stackra/events (STA-1387), where gen's entry imports it from |
| `registerRelays`                                                       | `.`           | gen's entry names the relays: listeners whose `handle` takes `EventEnvelope`   |
| `registerChangeConsumers`                                              | `.`           | watch a model's rows: `[[Product, ProductIndexConsumer]]` (gen writes it)      |
| `redactSubjectMessages`                                                | `.`           | erasure: nulls named fields in held messages naming a subject (`holding`)      |
| `ConsumesChanges`                                                      | `.`           | `@ConsumesChanges(Product)` on a consumer service; gen registers the pair      |
| `coalesceChanges`                                                      | `.`           | one change per row of a run, a later change superseding an earlier one         |
| `MemoryChangeFeedDriver`                                               | `.`           | the change log of a test or a single process                                   |
| `UnknownEventError`                                                    | `.`           | `unknown_event` (retryable): a received wire name this process does not know   |
| `MemoryOutboxDriver`, `MemoryInboxDriver`                              | `.`           | the stores of a test or a single process                                       |
| `OutboxConfig`, `OutboxConfig$`, `OutboxOptions`                       | `.`           | key `outbox`: `driver`, `batchWindowSeconds` (0-60), `changeRetentionDays`     |
| `OutboxDriver`, `InboxDriver`, `ChangeFeed`, `EventPublisher`          | `./contracts` | the ports                                                                      |
| `ChangeRecord`, `ChangeCursor`, `ChangeLogReport`                      | `./contracts` | a retained change, a consumer's place in the log, a maintenance run            |
| `OutboxMessage`, `EventEnvelope`, `RowChange`, `ChangeConsumer`, enums | `./contracts` | the stored message, the wire form, a row change and what a consumer implements |
| `CrossAppRelayService`                                                 | `./node`      | the cross-app relay: `connect(container)`, then `work({ signal })` or `relay()` |
| `CrossAppFanOut`                                                       | `./node`      | bound: `OutboxRelayService` writes a delivery per subscriber after publishing  |
| `RelayInboxService`                                                    | `./node`      | `receive({ method, headers, body })` behind `/events/inbox`: 204, 401, 405, 422 |
| `PostgresDeliveryDriver`                                               | `./node`      | the default delivery store: `outbox.deliveries`                                |
| `RelayDeliveriesCommand`, `RelayReplayCommand`                         | `./node`      | `outbox:relay-deliveries`, `outbox:relay-replay <dlv_id>`                      |
| `ConfigSubscriberSourceDriver`                                               | `.`           | subscribers from one environment's `EventsRelayConfig` (gen binds it)          |
| `Ed25519EventSignerDriver`, `ContractInboxVerifierDriver`                          | `.`           | sign as the producer; verify against the pinned producers' keys                |
| `MemoryDeliveryDriver`                                                 | `.`           | the delivery store of a test or a single process                               |
| `DeliveryDriver`, `SubscriberSource`, `EventSigner`, `InboxVerifier`   | `./contracts` | the cross-app relay's ports                                                    |
| `CrossAppEnvelope`, `Delivery`, `RelayKey`, `PinnedProducer`           | `./contracts` | the cross-app envelope, a stored delivery, a public key, a pinned producer     |
| `EventsRelayConfig`, `RelayInboxConfig`                                | `.`           | keys `outbox.events_relay` (keys, subscribers) and `outbox.relay_inbox`         |

## Writing in the producer's transaction

```ts
const database = await PostgresDatabaseDriver.connect({ url, subscribers: [outboxWriter] });

order.record(OrderPaid.create({ orderId: order.id })); // inside an action: one transaction (ADR 0136)
```

On each flush the writer takes the integration events every changed model recorded and notes a change message for
each watched row; just before the transaction (or savepoint) commits it writes them all in one statement inside it, so
they commit with the change or not at all, and a rollback drops them. A domain event is recorded back on its model for
the in-process dispatch; it never enters the outbox. Each message takes the scope of the transaction (the
`Database.withScope` settings), and the running action call's actor and id.

A caller that holds recorded events itself writes them through `EventOutbox` (`OutboxEventOutboxDriver`) in its own
transaction. The wire name is the one gen registered (`orders.order.paid.v1`), else the written name and version
(`order.paid.v1`).

## Relaying

```ts
relay.connect(container);
await relay.work({ signal: shutdown.signal });
```

Every tick, the relay that wins the `outbox.relay` lock (`Locks.tryWith`) takes up to 100 due messages, oldest first:
an event is published through the `EventPublisher` as an `EventEnvelope`, a row change is handed to every change
consumer of its model the container binds, in the row's scope. A delivered message is deleted; a failed one waits an
exponential backoff (from ten seconds, capped at an hour: the contracts `backoffDelay` over the queue's
`JOB_BACKOFF`) and is dead-lettered after its tenth attempt
(`outbox.message_dead` is logged). An idle relay polls every second. Delivery is at least once.

`outbox.batchWindowSeconds` (default `0`, at most `60`) lets due messages gather: a tick that finds fewer than a full
batch holds them until the oldest has been due that long, then delivers them together. A service that sends in batches
sets it in runway (the audit read trail uses `5`); every other service keeps `0` and ADR 0221's one-second lag.

## Receiving once

`InboxService.receive(envelope)` rebuilds the event from its registered class, claims its id and, on the first claim
only, delivers it to the bus and drains it, all in one transaction in the event's scope. The in-process publisher calls
it, and so does a consuming service's generated subscription. A redelivery runs nothing; an unknown wire name is refused
before the claim, so a later release can still receive it.

Event versions (`@stackra/versioning`, stackra-403): the relay publishes an event at its current version and then, for
each `Change` whose sunset has not come, at that older version (`<base>.v<from>`, its data run through `down`), all
under the same id. The inbox reads another version of an event it knows: an older one is lifted with `up` (`upgrade`)
to the class this process has, and a newer one is left unclaimed, because its older copy of the same id arrives too.
Either way the listeners run once per id. An older version whose change is gone (past its sunset) fails the receipt.

The claim compares ids as exact strings. Ids are minted by `@stackra/contracts`' `mintPublicId("evt")` (lowercase,
UUIDv7, ADR 0135); ids stored in the older forms (the outbox's uppercase ULID, actions' random form) are still
relayed and deduplicated unchanged (STA-1380).

## Watching rows

```ts
export class Product extends Model.with(HasPublicId("prd"), CapturesChanges({ values: true, exclude: ["cost"] })) {}

@ConsumesChanges(Product)
export class ProductIndexConsumer extends Service implements ChangeConsumer {
  async consume(change: RowChange): Promise<void> {
    if (change.kind === RowChangeKind.Deleted) await this.search.in(Product).remove([change.id]);
    else await this.search.in(Product).index([await this.products.findOneOrFail(change.id)]);
  }

  // optional: one call per run of one model's changes in one scope, coalesced to one change per row
  async consumeMany(changes: readonly RowChange[]): Promise<void> { ... }
}
```

Gen writes `registerChangeConsumers([[Product, ProductIndexConsumer]])` from the facet; a hand call still works.

- **What is captured.** A model with `CapturesChanges` (from @stackra/model), or one a consumer watches, writes one
  change per row at commit to `outbox.changes`: the model, the key, the kind and the written fields. With
  `values: true` it also carries `before` and `after` values of those fields, never of an encrypted, `@Classified` or
  excluded field, and only JSON values (a relation is left out). `CrudService`'s native verbs (`increment`, `delete`,
  `restore`, `repath`, `purge`) report their rows through the database's `NativeWriteWatcher` (the writer, connected at
  boot with `connectNativeWriteWatcher(writer)`), so they reach the log too, fields named but no values. Raw SQL a
  service writes itself is not seen.
- **Delivery.** Each consumer has a cursor in `outbox.change_cursors`. A tick reads the log after it (only entries no
  running transaction can still precede) and hands each run in its row's scope. A throw retries that consumer from its
  cursor with the relay's backoff and, after the last attempt, stalls it (`outbox.consumer_stalled`, nothing dropped)
  until `ChangeFeedService.resume` or `replay`; the other consumers move on. A new consumer starts at the log's start,
  so it reads the retained window; `backfill` hands it older rows by a scan. Consumers stay idempotent.
- **Retention.** The log keeps `outbox.changeRetentionDays` (7 by default). `data_maintenance.change_log.maintain`
  (02:30 UTC, a job of the add-on `@stackra/data-maintenance`) calls `ChangeFeed.maintain`, which makes the next three
  days' partitions and drops older ones whole; rows written before their day's partition existed sit in
  `outbox.changes_default` and are deleted past the window. Change messages already in `outbox.messages` from before
  the log still drain the old way.

## Delivering to other apps

A producer delivers an integration event to a consumer in another app over HTTP (ADR 0511 decisions 11 to 19,
STA-1910). After `OutboxRelayService` publishes an event in its own app, a bound `CrossAppFanOut` writes one row of
`outbox.deliveries` (migration `outbox.0005_create_deliveries`) per subscriber whose events include each published
version, unique on (event id, subscriber, type), so a retried message writes nothing twice; a fan-out failure fails the
message, which retries. Without a bound fan-out nothing changes. Subscribers come from a `SubscriberSource`; the first
driver, `ConfigSubscriberSourceDriver`, reads `EventsRelayConfig` (key `outbox.events_relay`), the
producer's runway `events` block of the running environment, which gen emits at build time.

`CrossAppRelayService` runs beside the outbox relay with its own lock (`outbox.cross-app`), held only while a tick
leases up to ten due deliveries per subscriber in one statement (their due time moves 110 seconds ahead, past a whole
batch at the timeout each). The lock and transaction are released before anything is sent; subscribers go in parallel,
each one's deliveries in order, a subscriber stops at its first failure, and each outcome is recorded on its own. A
row left unsent (after a failure, or by a crashed relay) is due again when its lease ends. A delivery is one `POST <inbox origin>/events/inbox` of the envelope (with
`envelopeVersion: 1`, without `producer`), signed by `Ed25519EventSignerDriver` in the Standard Webhooks layout:
`webhook-id` (the `dlv_` id), `webhook-timestamp`, `webhook-signature: v1a,<key id>,<base64>` over
`<id>.<timestamp>.<body>`. The private key is the PKCS#8 DER key as base64url, read by its secret name
(`STACKRA_EVENTS_SIGNING_KEY` by default) from the bound `SecretStore`; the current key is the first listed. Ten
seconds per request, no redirect followed. A network error, a timeout, a redirect, a 5xx, 408 or 429 backs off as the
outbox does; any other 4xx dead-letters at once; the tenth failure dead-letters; each dead letter is logged
(`outbox.delivery_dead`) with subscriber, type and code. `stackra outbox:relay-deliveries [--subscriber] [--state]`
lists them and `stackra outbox:relay-replay <dlv_id>` sends a dead one again.

On the consumer, gen's raw `/events/inbox` route hands the request to `RelayInboxService`. `ContractInboxVerifierDriver`
checks the headers, a five-minute window either way, a key id the pinned producer lists for the running environment
(raw base64url Ed25519 public keys; `RelayInboxConfig`, key `outbox.relay_inbox`, holds each pinned producer's keys
and events and the environment, `STACKRA_ENVIRONMENT`) and the signature, before the body is parsed. The envelope's
`producer` is then the verified service, never the body's, and `InboxService.receive` claims the id and runs the
listeners in one transaction. Answers: 204 handled, already received or a newer version that waits; 401 unverified
(the reason is logged, never the body); 403 an event the verified producer does not publish (`RelayInboxConfig` lists
each pinned producer's events, any version of a listed name passes), so one producer's key never runs another's
listeners; 422 a broken envelope or data, or an event this consumer does not know yet (nothing recorded). The producer
dead-letters a 403 or 422; replay a 422 for an unknown event with `outbox:relay-replay` once the consumer ships it. A
listener that throws propagates as a 5xx, so the producer retries.

## Drivers and tables

- **Postgres** (`./node`, default): `outbox.messages` (migration `outbox.0001_create_messages`, with the `ltree`
  extension), `outbox.inbox` (`outbox.0002_create_inbox`) and `outbox.changes` with `outbox.change_cursors`
  (`outbox.0004_create_changes`), and `outbox.deliveries` (`outbox.0005_create_deliveries`). The relay reads messages across scopes, so neither table
  has a row-level-security policy; a message's scope is data the relay opens for each delivery.
- **Memory** (`.`): the four stores in process memory, with no transaction.
- **Transports**: `InboxEventPublisherDriver` in process; the Encore Pub/Sub and Postgres queue transports between
  services are drivers gen supplies (ADR 0142).

## Broker transport

`BrokerEventPublisherDriver` (driver name `broker`) is the cross-service `EventPublisher`: the relay publishes each
envelope to the topic of its wire name through @stackra/queue's `BrokerPublisher`, so the broker the deployment runs
(Encore Pub/Sub, a Valkey stream) carries it. The message id is the event id; consumers deduplicate in their inbox.

## The offline queue's server stores

`./node` ships the durable drivers of three @stackra/actions ports, in tables migration `outbox.0003_create_offline_stores`
creates: `PostgresDeviceSequenceStoreDriver` (each device's last settled sequence, moved only upward),
`PostgresOfflineCapStoreDriver` (the applied calls of capped actions, pruned past the window) and
`PostgresReplicaLogDriver` (each replica partition's ordered changes, stamped with the record's scope and read only
within the caller's scope path, so a legal entity's device never receives another's records). Sealed payloads,
revoke and wipe are the client's (`@stackra/query`, `@stackra/storage`).

## Not here

- Outbox staging per workflow run (ADR 0102 decision 3) waits for @stackra/workflow.
- Listing and redriving dead messages wait for the console. Dead cross-app deliveries are not pruned yet (a
  `shortcut:` in `pruneOutbox`). `data_maintenance.outbox_message.prune` (03:15 UTC, a job of
  `@stackra/data-maintenance` over `pruneOutbox`) deletes dead letters and received event ids older than
  `outbox.pruneAfterDays` (30 by default).
- A `stackra changes:replay|resume|backfill` command and a panel for stalled cursors; `ChangeFeedService` is the API.
- Publishing both versions of an event until a change's sunset (ADR 0141 note) waits for gen's version table.

## Consuming another service's events

A consumer imports the producer's event class from `#stackra/clients/<service>` and types a listener's `handle` with
it; gen registers its wire name with `registerEventNames`, so `InboxService#receive` rebuilds it with its payload
schema and the bus runs that listener. A relay (the webhooks relay) types `handle` with `EventEnvelope` instead: once
`connect(container)` has resolved it, it gets every claimed envelope, an unknown wire name included (which is then
claimed, not refused). The generated boot connects the inbox after the container is ready and calls `disconnect()`
when the shutdown signal aborts. A relay that throws rolls the receipt back, so the event is redelivered: make it a queued
listener.
