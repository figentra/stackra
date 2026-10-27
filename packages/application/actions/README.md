# @stackra/actions

Stackra actions: the `Action`, `Query`, `Precondition`, `ExtensionPoint`, `Extension` and `Interceptor` kind bases, the
fixed action pipeline, the idempotency and rate-limit stores behind ports, `RequestContext`, the `RateLimitConfig`
configuration and the action testing helpers.

**Tier:** `tier:lib` (`packages/application/actions`). Entries `.`, `./contracts`, `./node` and `./testing`. Depends on
`@stackra/contracts`, `@stackra/container`, `@stackra/config`, `@stackra/errors`, `@stackra/events` and
`@stackra/validation`; `@stackra/testing` is an optional peer of `./testing`. It never imports `@stackra/iam`,
`@stackra/workflow`, `@stackra/queue` or `@stackra/database`: those implement its ports.

## What is here

| Entry         | Symbol                                                                                   | Use                                                                     |
| ------------- | ---------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| `.`           | `Action`, `ActionContext`                                                                | `extends Action({ key, actors, ... })`, `handle(input, ctx)`            |
| `.`           | `Query`, `QueryContext`                                                                  | `extends Query({ key, actors, ... })`, `handle(input, ctx)`             |
| `.`           | `Precondition`, `PreconditionContext`                                                    | `extends Precondition`, `check(ctx)`; listed in `preconditions`         |
| `.`           | `ExtensionPoint`, `Extension`, `ExtensionContext`, `ExtensionTable`                      | slots `after<V, A>()` and `before<A>()`; `Extension<Point["slot"]>`     |
| `.`           | `Interceptor`                                                                            | `extends Interceptor`, `intercept(ctx, next)`; listed in `interceptors` |
| `.`           | `Idempotency`, `OfflineMode`, `IdMinting`, `OfflinePrecondition`, `ConflictResolution`   | the enums of the `idempotency` and `offline` options                    |
| `.`           | `ActionPipeline`, `PipelineStage`, `RequestContext`                                      | the runtime: the fixed steps, their names, the running call's context   |
| `.`           | `RateLimitConfig`, `RateLimitConfig$`                                                    | the per-area token buckets (key `actions.rate_limit`)                   |
| `.`           | `MemoryIdempotencyStoreDriver`, `MemoryRateLimitStoreDriver`                             | the in-process stores                                                   |
| `.`           | `registerActions`, `registerExtensions`, `connectExtensions`                             | what gen's entry and the runtime call at boot                           |
| `.`           | `OfflineCap`, `ActionAccepts`, `RuleEvaluator`, `RuleEvaluation`                         | `offline.cap`, `accepts` (client rule code)                             |
| `.`           | `QueryReplica`, `ReplicaPage`, `ReplicaBounds`, `ReplicaFeed`                            | `replica` on a query, `ctx.replica(fill, slice)`, recording changes     |
| `.`           | `OfflineCapReachedError`, `DeviceSequenceOutOfOrderError`                                | `offline_cap_reached`, `device_sequence_out_of_order`                   |
| `.`           | `MemoryDeviceSequenceStoreDriver`, `MemoryOfflineCapStoreDriver`                         | the in-process device order and cap stores                              |
| `.`           | `MemoryReplicaLogDriver`, `MemoryReviewItemSinkDriver`                                   | the in-process replica log and review sink                              |
| `.`           | `rawBody`, `isRawBody`, `RawBody`                                                        | a query output the transport sends as the body itself (iCal, CSV)       |
| `./contracts` | `AccessControl`, `TenancyCheck`, `EntitlementCheck`, `FlagCheck`                         | the ports of the pipeline's checks                                      |
| `./contracts` | `IdempotencyStore`, `RateLimitStore`, `UnitOfWork`, `AuditTrail`                         | the ports of its stores and its transaction                             |
| `./contracts` | `RateLimitBudget`                                                                        | the plan-sized area bucket of a call's scope (a value entitlement)      |
| `./contracts` | `WorkflowRunner`, `JobDispatcher`, `ContextStorage`                                      | the ports behind `ctx.run`, `ctx.signal`, `ctx.dispatch`, the context   |
| `./contracts` | `DeviceSequenceStore`, `OfflineCapStore`, `ReplicaLog`, `ReviewItemSink`, `ReviewReason` | the offline stores and the review sink, with their types                |
| `./contracts` | `DeviceOrder`, `DeviceSequence`, `ReplicaRow`, `ReplicaChange`, `ReviewItem`             | the device on the call, a device's last settled call, replica rows      |
| `./contracts` | `CallClient`                                                                             | the network client on `ctx.client` (address, user agent)                |
| `./node`      | `AsyncContextStorageDriver`                                                              | `ContextStorage` over `AsyncLocalStorage`                               |
| `./testing`   | `run`, `fakeActionContext`, `fakeExtensionContext`, `extension`, `toHaveAudited`         | call through the real pipeline; fake contexts; inline extensions        |

## Declaring an action

```ts
import { Action, type ActionContext, Idempotency } from "@stackra/actions";
import { ActorKind } from "@stackra/contracts";

export class CreateOrderAction extends Action({
  key: "order.create",
  actors: [ActorKind.User, ActorKind.Agent],
  preconditions: [AcceptingOrdersPrecondition],
  idempotency: Idempotency.Required,
  rateLimit: { perMinute: 20 },
  tool: true,
}) {
  async handle(input: CreateOrderInput, ctx: ActionContext): Promise<CreateOrderOutput> {
    return ctx.run(CreateOrderWorkflow, input);
  }
}
```

The key is written once; gen derives the module, the locked key (`orders.order.create@1`), the permission and the
route, and registers them with `registerActions`. A query is the same with `Query({...})`; it takes no preconditions,
idempotency, job or offline option, and `tool` is on by default. An action a user can perform is a tool too unless it
says `tool: false` (with a `// reason:` line gen reads, ADR 0360 decision 4); `effects: [Effect.Financial]` declares
its effect tags (`Effect` from `@stackra/actions/contracts`, snake_case codes).

## The pipeline

`ActionPipeline.execute(Class, input, { actor, idempotencyKey, locale, ... })` runs, in this order and no other:
tenancy, permission (the actor kind, then `AccessControl`), preconditions, entitlement, flag, input validation,
approval and idempotency, rate limit, interceptors, then `handle` (an action's in its `UnitOfWork`, with its usage
event and its success audit entry, all inside the `LimitReservation` when one is bound: reserve, then commit), then the
`afterCommit` work. A refusal's audit entry is written after the rollback. A step whose port nobody binds is skipped,
except permission, which fails closed. Approval runs only when an `ApprovalGate` is bound; an action that declares
`approval: true` fails closed without one (ADR 0397 as amended by STA-813). An action that declares
`stepUp: AssuranceLevel.Aal2` is checked right after the permission by the bound `StepUpCheck` (a driver over
`@stackra/identity`'s `requireAssurance`) against `CallOptions.assurance` (`amr`, `authTime`, `level` from the verified
token), and fails closed without one; handlers read the same facts as `ctx.assurance`.

The rate-limit step takes one token from the call's area bucket, keyed by the tenant (or, for a platform call, the
actor), and one from the action's own `rateLimit`. When a `RateLimitBudget` is bound and answers a bucket for the call,
that bucket sizes the area bucket (ADR 0217 decision 2: per app and tenant, sized by the plan); `@stackra/entitlements`
is meant to bind it over a value entitlement per area (ADR 0408). When it answers `undefined`, or none is bound, the
area's `RateLimitConfig` entry applies. The key does not change, so a plan change resizes the same bucket.

The call carries its scope (ADR 0327 decision 6): the transport passes the `ScopeRef` the resolver chain settled on as
`CallOptions.scope`, every port reads it on the `CallDescriptor`, a handler reads `ctx.scope`, and a job queued with
`ctx.dispatch` runs in it. No scope is a platform call. `ctx.period(input)` reads a query's `range` (`today`,
`yesterday`, `last_7_days`, `last_30_days`, `this_month`, or `custom` with `from` and `to`) in the call's time zone.

Two more call facts come from the transport, never from input (STA-1248). `CallOptions.sandbox: true` marks a call
in the tenant's sandbox (a private app installed for trial, OS-132): every port sees `CallDescriptor.sandbox` (so an
entitlement driver can let any tier install into its sandbox) and a handler reads `ctx.sandbox`. `CallOptions.client`
(`{ address, userAgent? }`) is the network client, from the connection or the edge's trusted forwarding header; it
reaches `ctx.client` only (no port, no audit entry), so a public query such as a traffic hit can count it. It is
personal data: hash or truncate it before keeping it.

A query whose response is not JSON (an iCalendar feed, a CSV) returns `rawBody(contentType, body, filename?)`; the
transport tests the output with `isRawBody` and sends the body as is with that content type. An ordinary output with
`contentType` and `body` fields stays JSON: only the `~raw` marker counts.

An action that also runs as a job declares `job: { queue, unique, timeout, retries, cron }`; `cron: { schedule,
perScope: true }` runs once per scope the scheduler's `CronScopes` driver lists instead of once for the platform.

## Governance in the pipeline

- **Approval** (stage `approval`, before idempotency): a bound `ApprovalGate` decides from the tenant's approval rules
  whether a call needs an approval; it parks a request and refuses `approval_required` with its `approvalId`, and the
  call resubmitted with `CallOptions.approvalId` runs once the request is granted. Which calls need approval is data,
  never code. A second approver (billing's ad-hoc coupons, OS-381) is this stage with an `ApproverRule` of
  `notRequester: true`: the gate's driver checks a grant with `approverRefusal(rule, approver, call.actor)`, which
  refuses the requester and the human an agent acts for, so a service needs no two-step request and approve of its
  own.
- **Effect tags**: `Effect` (`financial`, `security`, `pii`, `external_communication`, `irreversible`, `bulk`) travel
  with the permission in `registerActions` and reach every port on `CallDescriptor.effects`.
- **Live configuration**: an action declared `structural: true` runs only where the bound `LiveConfigurationGuard`
  allows it; in live it is refused `live_read_only`.
- **Meters**: `meter: { name, kind, field? }` writes one `UsageRecorded` (`usage.recorded`) event through the
  `EventOutbox` in the action's unit of work, so a metered call never commits without its usage.
- **Audit**: `OutboxAuditTrailDriver` writes each audit entry as an `AuditEntryRecorded` event for the audit service.
- **Stores**: `StoresConfig` (key `actions.stores`) picks `memory`, `valkey` or `postgres` for the idempotency and
  rate-limit stores; the Valkey drivers are in `./node` (`ACTIONS_VALKEY_URL`), and the `postgres` drivers come
  through `@stackra/database`; the offline queue's Postgres stores through `@stackra/outbox`.

## Offline clients

The server half of ADR 0338 and the `accepts` option of ADR 0337. The client half (the queue, sealed stores, replicas
on the device) lives in `@stackra/query`, `@stackra/storage` and `@stackra/clients`.

- **Per-device order.** The generated adapter reads the `DEVICE_ORDER` headers of `@stackra/clients` (this package
  names no header) and sets `CallOptions.device` (`{ deviceId, sequence? }`) once the id matches the verified
  session's device. A device's sequences are strictly increasing and not contiguous, and the client sends one call at
  a time. The pipeline applies a call whose sequence is above the device's last settled one, around every step, and
  settles it on an output or any refusal, so a rejected call never blocks the next. A sequence at or below the last
  settled one is a resend: it replays its stored output (same Idempotency-Key) or is refused
  `device_sequence_out_of_order` with `acknowledged`. Bind a `DeviceSequenceStore`; `last(deviceId)` is the device's
  last acknowledged sequence, which the `devices.device.acknowledged` query of `@stackra/devices` answers. A call
  with a device and no sequence (that query) is not ordered; `ctx.deviceId` names the device.
- **Caps.** `offline: { ..., cap: { count?, amount?, window } }`. The client refuses the action offline at the cap;
  the idempotency step counts the device's applied calls in the window (`OfflineCapStore`) and refuses beyond it
  with the same `offline_cap_reached`. The amount is read from `input.amount`, as the client reads it: minor units,
  or a Money's `minor`.
- **Client rule code.** `accepts: { ruleVersion: "2.4.0", evaluator: SaleEvaluator }`. In the unit of work, before
  `handle`, the evaluator (a class you write, resolved by class) answers `{ ruleVersion, client, server }` for the
  document in the input. A different answer or an older rule version is recorded on the `ReviewItemSink` with both
  answers; the call is never refused, and `handle` applies the server's figure. The review item's record is the
  consuming product's model: bind a sink that writes it (the memory driver keeps items in process).
- **Replicas.** `Query({ ..., replica: { of: Sale, window: "30d", limit: 5_000, scope?: "legalEntityId" } })`. The
  client calls it with `{ cursor, ...slice }` as input. Its `handle` authorizes the caller's slice and returns
  `ctx.replica(fill, slice)`: the rows changed and the ids removed since the input's `cursor`, or a full fill (the
  rows `fill` reads within the bounds) on the first refresh or a cursor the log no longer holds, with the next opaque
  cursor and `asOf`. That is the `ReplicaChanges` wire shape `@stackra/query` parses. Producers record changes with
  `ReplicaFeed.record(Query, changes, { slice, scope })` in the same unit of work as the change, so the live query's
  refresh (its `cache.invalidateOn` events, delivered by `@stackra/realtime` after commit on the routes
  `liveQueryRoutes` derives) never arrives first. A read returns only entries within the caller's scope.

```ts
export class RedeemGiftCardAction extends Action({
  key: "gift_card.redeem",
  actors: [ActorKind.User],
  offline: { ...QUEUED, cap: { count: 5, amount: 50_000, window: "24h" } },
}) { ... }

export class RecentSalesQuery extends Query({
  key: "sale.recent",
  actors: [ActorKind.User],
  replica: { of: Sale, window: "30d", limit: 5_000, scope: "legalEntityId" },
  cache: { ttl: "1m", invalidateOn: [SaleCompleted] },
}) {
  async handle(_input: RecentSalesInput, ctx: QueryContext): Promise<ReplicaPage> {
    const entity = await this.devices.legalEntityOf(ctx); // the caller's verified slice
    return ctx.replica((bounds) => this.sales.recent(entity, bounds), entity);
  }
}
```

## Extension points

```ts
export class OrderExtensionPoint extends ExtensionPoint {
  readonly adjustTotals = ExtensionPoint.after<OrderTotals, [draft: OrderDraft]>();
  readonly verifyPlacement = ExtensionPoint.before<[draft: OrderDraft]>();
}

export class RedeemPointsExtension extends Extension<OrderExtensionPoint["adjustTotals"]>({ order: 200 }) {
  async handle(totals: OrderTotals, draft: OrderDraft, ctx: ExtensionContext): Promise<OrderTotals> { ... }
}

const adjusted = await this.extensions.adjustTotals(base, draft, ctx); // the owner calls the slot
```

## Testing

```ts
import { run, fakeActionContext, extension } from "@stackra/actions/testing";

const placed = await run(CreateOrderAction, input, { as: actors.customer(), idempotencyKey: "k1" });
expect(placed.output.orderId).toMatch(/^ord_/);
expect(await run(CreateOrderAction, input, { as })).toRefuseWith(refusal(OrdersPausedError));
expect(placed).toHaveAudited({ outcome: "ok", fields: { orderId: placed.output.orderId } });

const ctx = fakeActionContext({ actor: actors.admin() });
await service.reenable(scopeId, ctx);
expect(ctx).toHaveAudited({ fields: { scopeId } }); // the fields passed to ctx.audit; no outcome on a fake context

createTestingModule(OrdersModule).withExtensions([
  extension(OrderExtensionPoint, "adjustTotals", { order: 10 }, (totals) => discounted(totals)),
]);
```
