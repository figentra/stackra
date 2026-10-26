# @stackra/events

Stackra events: the four event kind bases, the `Listener` kind base, the in-process bus, event recording kept off the
aggregate, the `EventOutbox` port and the event testing helpers.

**Tier:** `tier:lib` (`packages/foundation/events`). Entries `.`, `./contracts` and `./testing`. Depends on
`@stackra/contracts`, `@stackra/container` and `@stackra/validation`; `@stackra/testing` is an optional peer of
`./testing`. It never imports `@stackra/outbox`, `@stackra/analytics`, `@stackra/integrations` or `@stackra/realtime`:
those import it (ADR 0305 rule 20).

## What is here

| Entry         | Symbol                                                                         | Use                                                                 |
| ------------- | ------------------------------------------------------------------------------ | ------------------------------------------------------------------- |
| `.`           | `DomainEvent`                                                                  | `extends DomainEvent`, bare: a fact that stays in the service       |
| `.`           | `IntegrationEvent`                                                             | `extends IntegrationEvent({ name, version, webhook, broadcast })`   |
| `.`           | `WebhookEvent`                                                                 | `extends WebhookEvent<ResendIntegration>({ type })`                 |
| `.`           | `AnalyticsEvent`                                                               | `extends AnalyticsEvent({ name })`, delivered by @stackra/analytics |
| `.`           | `Listener`, `ListenerContext`                                                  | `extends Listener` or `extends Listener({ queue, retry })`          |
| `.`           | `BroadcastAudience`                                                            | `Principal` (default) or `Tenant`                                   |
| `.`           | `Event`                                                                        | the abstract shared base; `X.create({...})`; never extended         |
| `.`           | `EventBus`                                                                     | the in-process bus the unit of work, relay and inbox use            |
| `.`           | `recordEvent`, `takeRecordedEvents`                                            | recording beside an aggregate, taken at commit                      |
| `.`           | `registerListeners`                                                            | the event-to-listener pairs gen writes                              |
| `./contracts` | `EventOutbox`, `EventMeta`, `RecordedEvent`                                    | the outbox port and the occurrence types                            |
| `./testing`   | `dispatch`, `drainEvents`, `drainOutbox`, `deliverRemoteEvent`                 | run events and listeners in a test                                  |
| `./testing`   | `OutboxFake`, `toEmit`, `toRecord`, `PublishedEvents`, `EVENTS_TESTING_PLUGIN` | the outbox fake, the matchers, `app.events`, `app.listeners`        |

## Declaring events

```ts
import { BroadcastAudience, DomainEvent, IntegrationEvent } from "@stackra/events";

/** Stays in the service; dispatched after commit, never written to the outbox. */
export class PointsRedeemed extends DomainEvent {
  memberId!: string;
  points!: number;
}

/** Leaves through the outbox as `orders.order.paid.v1`. */
export class OrderPaid extends IntegrationEvent({
  name: "order.paid",
  webhook: true,
  broadcast: { permission: OrderPermissions.read, audience: BroadcastAudience.Tenant },
}) {
  orderId!: PublicId<"ord">;
}

order.record(OrderPaid.create({ orderId }));
```

An event's fields are its payload; `X.create({...})` builds a frozen instance through the class's generated schema.
The id, time, tenant and actor travel beside it in a `RecordedEvent`, never on it (ADR 0294 decision 27). An event
name is dotted snake_case, written once; gen adds the module key and the version.

## Listening

```ts
import { Listener, type ListenerContext } from "@stackra/events";

export class EarnOnOrderPaidListener extends Listener({ queue: Queues.Default }) {
  async handle(event: OrderPaid, ctx: ListenerContext): Promise<void> {
    await this.accounts.earn(event.customerId, { reference: event.orderId, at: ctx.now() });
  }
}
```

The type of `handle`'s first parameter is the subscription; gen reads it and writes `registerListeners([...])`. A
failing listener is recorded on its delivery and never reaches the emitter or the other listeners.

Another service's event is subscribed to the same way: import its class from `#stackra/clients/<service>` and type
`handle` with it (ADR 0260 decision 4). That class is an `IntegrationEvent` at runtime, so the bus matches it by
`instanceof` and `registerListeners` takes it; there is no subscription by wire name. In a test,
`deliverRemoteEvent(AppApproved, { appId })` builds it through its payload schema.

### When a listener runs

Every in-process listener (`extends Listener`) runs after the commit, never inside the transaction, and a rolled-back
unit of work runs none (ADR 0078 decision 4). The path differs by event kind:

| Event                                                  | Path to the listener                                                                                                                                       | Runs                                                                     |
| ------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| `DomainEvent`                                          | the unit of work dispatches it to the bus after the commit and drains it                                                                                   | at the end of the same call                                              |
| The service's own `IntegrationEvent`                   | written to the outbox in the transaction; the relay publishes the committed row; the service's inbox claims its id, `deliver`s it to the bus and drains it | once per event id, within the relay's lag (under five seconds, ADR 0221) |
| Another service's event (`#stackra/clients/<service>`) | the producer's relay, the broker topic, this service's generated subscription, its inbox                                                                   | once per event id                                                        |

So a listener on its own service's integration event (scheduling-calendar's `BookingCreated`) runs in process, after
commit and once, but not synchronously with the call: read the committed row, never state the call left in memory. It
reaches the service's own inbox through the outbox's `inbox` publisher driver. With the `broker` driver it does so
only when gen subscribes the service to its own topics; gen does not yet (STA-1267 follow-up, owned by
`packages/developer/gen`), so a service that runs the broker driver and listens to its own integration events needs
that subscription first. `src/testing/functions/__tests__/drain-outbox.after-commit.test.ts` pins the guarantee.

A service's generated boot (`#stackra/boot`) calls `bus.connect(container)` once the container is ready, which
subscribes every registered listener the container binds, and `bus.disconnect()` when the shutdown signal aborts,
which removes exactly those (direct `subscribe` calls stay).

## Testing

```ts
import { createTestingModule } from "@stackra/container/testing";
import { deliverRemoteEvent, drainOutbox } from "@stackra/events/testing";

const app = await createTestingModule(CommerceModule).useDrivers("memory").compile();
await deliverRemoteEvent(PaymentCaptured, capture, { id: "evt_1" });
await drainOutbox();
expect(app.listeners.failures(MarkOrderPaidListener)).toHaveLength(0);
expect(app.events.published()).toRecord(OrderPaid, { orderId });
```

`drainOutbox()` works through `OutboxFake`, the in-memory `EventOutbox`, so this package never depends on the outbox.
`toRecord` also reads a `run()` result's `events`.
