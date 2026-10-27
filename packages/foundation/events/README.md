# @stackra/events

Stackra events: the four event kind bases, the `Listener` kind base, the in-process bus, event recording kept off the
aggregate, the `EventOutbox` and `RegionBus` ports and the event testing helpers.

**Tier:** `tier:lib` (`packages/foundation/events`). Entries `.`, `./contracts`, `./devtools` and `./testing`. Depends on
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
| `.`           | `crossRegionRecords`                                                           | the records of a batch the relay sends to the other regions         |
| `./contracts` | `EventOutbox`, `EventMeta`, `RecordedEvent`                                    | the outbox port and the occurrence types                            |
| `./contracts` | `RegionBus`                                                                    | the port that carries platform events to the other regions          |
| `./testing`   | `dispatch`, `drainEvents`, `drainOutbox`, `deliverRemoteEvent`                 | run events and listeners in a test                                  |
| `./testing`   | `OutboxFake`, `toEmit`, `toRecord`, `PublishedEvents`, `EVENTS_TESTING_PLUGIN` | the outbox fake, the matchers, `app.events`, `app.listeners`        |
| `./testing`   | `RegionBusFake`                                                                | the in-memory `RegionBus`; `sent()`                                 |

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
  broadcast: { permission: OrderPermissions.read, audience: BroadcastAudience.Scope },
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

## Across regions

Regions are independent and tenant data never leaves its region (ADR 0353 decision 5). A platform fact authored once
and copied read-only to every region, such as entitlements' approved plan catalogue version, opts in with
`crossRegion: true`:

```ts
export class CatalogueVersionApproved extends IntegrationEvent({
  name: "catalogue_version.approved",
  crossRegion: true,
}) {
  versionId!: string;
}
```

After the relay publishes a committed batch in its own region, it hands `crossRegionRecords(batch)` to the
`RegionBus`, whose driver sends them to every other region of the environment; each receiving region gives each record
to its own inbox under the same event id, so the copy listener runs once and the copy is never sent on again. A
cross-region occurrence that carries `meta.scopeId` is refused with a `TypeError`: it is a modelling error.

Not built here: the relay call (`@stackra/outbox`), the `RegionBus` driver and which transport carries it between
regions (root runway; an ADR is due, STA-1268). Until a driver is bound, nothing crosses.

## Devtools

`@stackra/events/devtools` is the dev-only entry (ADR 0246 decision 4). `defineEventsDevtools(kit, bus)` defines two
tabs on the devtools kit and returns their remover:

| Tab                 | Shows                                                                                  |
| ------------------- | -------------------------------------------------------------------------------------- |
| `events.listeners`  | each event class and the listener classes registered for it                            |
| `events.deliveries` | each delivery the bus made: event class, event id, listener class, `ok`, error message |

Names and ids only, never payloads: the kit's own `bus` channel already carries each event. The kit is taken by shape
(`DevtoolsTabSink` from `@stackra/container/devtools`), because `@stackra/devtools-kit` depends on this package.

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
