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
| `.`           | `OFFLINE_HEADERS`, `OfflineCap`, `ActionAccepts`, `RuleEvaluator`, `RuleEvaluation`      | offline replay headers, `offline.cap`, `accepts` (client rule code)     |
| `.`           | `QueryReplica`, `ReplicaPage`, `ReplicaBounds`, `ReplicaFeed`                            | `replica` on a query, `ctx.replica(fill, slice)`, recording changes     |
| `.`           | `OfflineCapReachedError`, `DeviceSequenceOutOfOrderError`                                | `offline_cap_reached`, `device_sequence_out_of_order`                   |
| `.`           | `MemoryDeviceSequenceStoreDriver`, `MemoryOfflineCapStoreDriver`                         | the in-process device order and cap stores                              |
| `.`           | `MemoryReplicaLogDriver`, `MemoryReviewItemSinkDriver`                                   | the in-process replica log and review sink                              |
| `./contracts` | `AccessControl`, `TenancyCheck`, `EntitlementCheck`, `FlagCheck`                         | the ports of the pipeline's checks                                      |
| `./contracts` | `IdempotencyStore`, `RateLimitStore`, `UnitOfWork`, `AuditTrail`                         | the ports of its stores and its transaction                             |
| `./contracts` | `WorkflowRunner`, `JobDispatcher`, `ContextStorage`                                      | the ports behind `ctx.run`, `ctx.signal`, `ctx.dispatch`, the context   |
| `./contracts` | `DeviceSequenceStore`, `OfflineCapStore`, `ReplicaLog`, `ReviewItemSink`, `ReviewReason` | the offline stores and the review sink, with their types                |
| `./node`      | `AsyncContextStorageDriver`                                                              | `ContextStorage` over `AsyncLocalStorage`                               |
| `./testing`   | `run`, `fakeActionContext`, `fakeExtensionContext`, `extension`                          | call through the real pipeline; fake contexts; inline extensions        |

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
idempotency, job or offline option, and `tool` is on by default.

## The pipeline

`ActionPipeline.execute(Class, input, { actor, idempotencyKey, locale, ... })` runs, in this order and no other:
tenancy, permission (the actor kind, then `AccessControl`), preconditions, entitlement, flag, input validation and
idempotency, rate limit, interceptors, then `handle` (an action's in its `UnitOfWork`), then the `afterCommit` work and
the audit entry. A step whose port nobody binds is skipped, except permission, which fails closed.

The call carries its scope (ADR 0327 decision 6): the transport passes the `ScopeRef` the resolver chain settled on as
`CallOptions.scope`, every port reads it on the `CallDescriptor`, a handler reads `ctx.scope`, and a job queued with
`ctx.dispatch` runs in it. No scope is a platform call. `ctx.period(input)` reads a query's `range` (`today`,
`yesterday`, `last_7_days`, `last_30_days`, `this_month`, or `custom` with `from` and `to`) in the call's time zone.

An action that also runs as a job declares `job: { queue, unique, timeout, retries, cron }`; `cron: { schedule,
perScope: true }` runs once per scope the scheduler's `CronScopes` driver lists instead of once for the platform.

## Offline clients

The server half of ADR 0338 and the `accepts` option of ADR 0337. The client half (the queue, sealed stores, replicas
on the device) lives in `@stackra/query`, `@stackra/storage` and `@stackra/clients`.

- **Per-device order.** A call replayed from a device's queue carries `Stackra-Device-Id` and
  `Stackra-Device-Sequence` (`OFFLINE_HEADERS`); the transport maps them to `CallOptions.device` once the id matches
  the verified session's device. The pipeline runs a device's call only when its sequence is the next one, around
  every step, and settles it on an output or any refusal, so a rejected call never blocks the next. A later sequence
  is refused `device_sequence_out_of_order` with `expected`; a resend of a settled one replays its stored output (same
  Idempotency-Key) or is refused with `expected` above it. Bind a `DeviceSequenceStore`; `last(deviceId)` is the
  device's last acknowledged sequence (the `devices.device.sequence` query of `@stackra/devices` lists it).
- **Caps.** `offline: { ..., cap: { count?, amount?, amountField?, window } }`. The client refuses the action offline
  at the cap; the idempotency step counts the device's applied calls in the window (`OfflineCapStore`) and refuses
  beyond it with the same `offline_cap_reached`. The amount is read from `input[amountField ?? "amount"]`: minor
  units, or a Money's `minor`.
- **Client rule code.** `accepts: { ruleVersion: "2.4.0", evaluator: SaleEvaluator }`. In the unit of work, before
  `handle`, the evaluator (a class you write, resolved by class) answers `{ ruleVersion, client, server }` for the
  document in the input. A different answer or an older rule version is recorded on the `ReviewItemSink` with both
  answers; the call is never refused, and `handle` applies the server's figure.
- **Replicas.** `Query({ ..., replica: { of: Sale, window: "30d", limit: 5_000, scope?: "legalEntityId" } })`. Its
  `handle` authorizes the caller's slice and returns `ctx.replica(fill, slice)`: the changes since the cursor the
  client sent (`Stackra-Replica-Cursor`, `CallOptions.replicaCursor`), or a full fill on the first refresh or a cursor
  the log no longer holds, with the next opaque cursor and `asOf`. Producers record changes with
  `ReplicaFeed.record(Query, changes, { slice, scope })` in the same unit of work as the change, so the live query's
  refresh (its `cache.invalidateOn` events, delivered by `@stackra/realtime` after commit) never arrives first. A
  read returns only entries within the caller's scope.

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
  async handle(_input: RecentSalesInput, ctx: QueryContext): Promise<ReplicaPage<SaleRow>> {
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

createTestingModule(OrdersModule).withExtensions([
  extension(OrderExtensionPoint, "adjustTotals", { order: 10 }, (totals) => discounted(totals)),
]);
```
