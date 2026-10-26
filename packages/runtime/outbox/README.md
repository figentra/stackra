# @stackra/outbox

Stackra outbox: the answer to "must another service learn of a committed change, even if this process dies after the
commit?" (ADR 0078). Integration events, and the row changes of watched models, are written to an outbox table in the
same transaction as the change; a relay publishes them after the commit, one relay per service under a lock, with
backoff retries and dead letters; the inbox runs each received event once.

**Tier:** `tier:lib` (`packages/runtime/outbox`). Entries `.`, `./contracts` and `./node`. Depends on
`@stackra/actions`, `@stackra/config`, `@stackra/container`, `@stackra/contracts`, `@stackra/database`,
`@stackra/errors`, `@stackra/events`, `@stackra/locking`, `@stackra/queue`, `@stackra/validation` and zod.

## What is here

| Symbol                                                                 | Entry         | Use                                                                            |
| ---------------------------------------------------------------------- | ------------- | ------------------------------------------------------------------------------ |
| `OutboxWriterService`                                                  | `./node`      | the ORM flush writer, passed as one of `DatabaseOptions.subscribers`           |
| `OutboxRelayService`                                                   | `./node`      | `connect(container)`, then `work({ signal })` or one `relay()` tick            |
| `InboxService`                                                         | `./node`      | `receive(envelope)` runs an event's listeners and relays once; `prune(before)` |
| `InboxService#connect`                                                 | `./node`      | `connect(container)` resolves the registered relays; `disconnect()` drops them |
| `InboxEventPublisherDriver`                                            | `./node`      | the in-process `EventPublisher`: publishes into this service's inbox           |
| `PostgresOutboxDriver`, `PostgresInboxDriver`                          | `./node`      | the default stores: `outbox.messages` and `outbox.inbox`                       |
| `OutboxEventOutboxDriver`                                              | `.`           | the driver of @stackra/events' `EventOutbox` port                              |
| `registerEventNames`                                                   | `.`           | gen's entry registers each integration event's locked wire name                |
| `registerRelays`                                                       | `.`           | gen's entry names the relays: listeners whose `handle` takes `EventEnvelope`   |
| `registerChangeConsumers`                                              | `.`           | watch a model's rows: `[[Product, ProductIndexConsumer]]`                      |
| `UnknownEventError`                                                    | `.`           | `unknown_event` (retryable): a received wire name this process does not know   |
| `MemoryOutboxDriver`, `MemoryInboxDriver`                              | `.`           | the stores of a test or a single process                                       |
| `OutboxConfig`, `OutboxConfig$`, `OutboxOptions`                       | `.`           | key `outbox`: `driver` (`postgres` default, `memory`) picks both stores        |
| `OutboxDriver`, `InboxDriver`, `EventPublisher`                        | `./contracts` | the ports                                                                      |
| `OutboxMessage`, `EventEnvelope`, `RowChange`, `ChangeConsumer`, enums | `./contracts` | the stored message, the wire form, a row change and what a consumer implements |

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
exponential backoff (from ten seconds, capped at an hour) and is dead-lettered after its tenth attempt
(`outbox.message_dead` is logged). An idle relay polls every second. Delivery is at least once.

## Receiving once

`InboxService.receive(envelope)` rebuilds the event from its registered class, claims its id and, on the first claim
only, delivers it to the bus and drains it, all in one transaction in the event's scope. The in-process publisher calls
it, and so does a consuming service's generated subscription. A redelivery runs nothing; an unknown wire name is refused
before the claim, so a later release can still receive it.

## Watching rows

```ts
export class ProductIndexConsumer extends Service implements ChangeConsumer {
  async consume(change: RowChange): Promise<void> {
    if (change.kind === RowChangeKind.Deleted) await this.search.in(Product).remove([change.id]);
    else await this.search.in(Product).index([await this.products.findOneOrFail(change.id)]);
  }
}

registerChangeConsumers([[Product, ProductIndexConsumer]]);
```

A change names the model, the row's key, how it changed and the fields written; never the values. A consumer is
idempotent: a throw retries the change for every consumer of the model.

## Drivers and tables

- **Postgres** (`./node`, default): `outbox.messages` (migration `outbox.0001_create_messages`, with the `ltree`
  extension) and `outbox.inbox` (`outbox.0002_create_inbox`). The relay reads messages across scopes, so neither table
  has a row-level-security policy; a message's scope is data the relay opens for each delivery.
- **Memory** (`.`): both stores in process memory, with no transaction.
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
- Listing and redriving dead messages, and the retention purge jobs, wait for the scheduler and the console.
- Publishing both versions of an event until a change's sunset (ADR 0141 note) waits for gen's version table.

## Consuming another service's events

A consumer imports the producer's event class from `#stackra/clients/<service>` and types a listener's `handle` with
it; gen registers its wire name with `registerEventNames`, so `InboxService#receive` rebuilds it with its payload
schema and the bus runs that listener. A relay (the webhooks relay) types `handle` with `EventEnvelope` instead: once
`connect(container)` has resolved it, it gets every claimed envelope, an unknown wire name included (which is then
claimed, not refused). The generated boot connects the inbox after the container is ready and calls `disconnect()`
when the shutdown signal aborts. A relay that throws rolls the receipt back, so the event is redelivered: make it a queued
listener.
