# @stackra/actions

<!--
Stackra file contract:
Purpose: the package's reader guide: actions, queries, the pipeline, call options, jobs and the testing kit.
Boundary: documentation only; the code and the ADRs win on any difference.
Runtime: none
Governing contract: ADR 0098; ADR 0294; ADR 0305; ADR 0472; owner D10 2026-10-28 (stackra-223: one RetryPolicy, backoffDelay and Duration).
-->

Stackra actions: the `Action`, `Query`, `Precondition`, `ExtensionPoint`, `Extension` and `Interceptor` kind bases, the
fixed action pipeline, the idempotency and rate-limit stores behind ports, `RequestContext`, the `RateLimitConfig`
configuration and the action testing helpers.

**Tier:** `tier:lib` (`packages/application/actions`). Entries `.`, `./contracts`, `./devtools`, `./node` and `./testing`. Depends on
`@stackra/contracts`, `@stackra/container`, `@stackra/config`, `@stackra/errors`, `@stackra/events` and
`@stackra/validation`; `@stackra/testing` is an optional peer of `./testing`. It never imports `@stackra/iam`,
`@stackra/workflow`, `@stackra/queue` or `@stackra/database`: those implement its ports.

## What is here

| Entry         | Symbol                                                                                             | Use                                                                     |
| ------------- | -------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| `.`           | `Action`, `ActionContext`                                                                          | `extends Action({ key, actors, ... })`, `handle(input, ctx)`            |
| `.`           | `Query`, `QueryContext`                                                                            | `extends Query({ key, actors, ... })`, `handle(input, ctx)`             |
| `.`           | `Precondition`, `PreconditionContext`                                                              | `extends Precondition`, `check(ctx)`; listed in `preconditions`         |
| `.`           | `ExtensionPoint`, `Extension`, `ExtensionClass`, `ExtensionContext`, `ExtensionTable`              | slots `after<V, A>()` and `before<A>()`; `Extension<Point["slot"]>`     |
| `.`           | `Interceptor`                                                                                      | `extends Interceptor`, `intercept(ctx, next)`; listed in `interceptors` |
| `.`           | `Idempotency`, `OfflineMode`, `IdMinting`, `OfflinePrecondition`, `ConflictResolution`             | the enums of the `idempotency` and `offline` options                    |
| `.`           | `ActionPipeline`, `PipelineStage`, `RequestContext`                                                | the runtime: the fixed steps, their names, the running call's context   |
| `.`           | `RateLimitConfig`, `RateLimitConfig$`                                                              | the per-area token buckets (key `actions.rate_limit`)                   |
| `.`           | `MemoryIdempotencyStoreDriver`, `MemoryRateLimitStoreDriver`                                       | the in-process stores                                                   |
| `.`           | `registerActions`, `registerExtensions`, `connectExtensions`                                       | what gen's entry and the runtime call at boot                           |
| `.`           | `OfflineCap`, `ActionAccepts`, `RuleEvaluator`, `RuleEvaluation`                                   | `offline.cap`, `accepts` (client rule code)                             |
| `.`           | `QueryReplica`, `ReplicaPage`, `ReplicaBounds`, `ReplicaFeed`                                      | `replica` on a query, `ctx.replica(fill, slice)`, recording changes     |
| `.`           | `OfflineCapReachedError`, `DeviceSequenceOutOfOrderError`                                          | `offline_cap_reached`, `device_sequence_out_of_order`                   |
| `.`           | `MemoryDeviceSequenceStoreDriver`, `MemoryOfflineCapStoreDriver`                                   | the in-process device order and cap stores                              |
| `.`           | `MemoryReplicaLogDriver`, `MemoryReviewItemSinkDriver`                                             | the in-process replica log and review sink                              |
| `.`           | `rawBody`, `isRawBody`, `RawBody`                                                                  | a query output the transport sends as the body itself (iCal, CSV)       |
| `.`           | `QueryCache`, `CacheScope`, `registerCachedQueries`, `QueryCacheEvictorListener`                   | a query's `cache` option, its sharing, and the evictor gen registers    |
| `./contracts` | `AccessControl`, `TenancyCheck`, `EntitlementCheck`, `FlagCheck`                                   | the ports of the pipeline's checks                                      |
| `./contracts` | `IdempotencyStore`, `RateLimitStore`, `UnitOfWork`, `AuditTrail`                                   | the ports of its stores and its transaction                             |
| `./contracts` | `RateLimitBudget`                                                                                  | the plan-sized area bucket of a call's scope (a value entitlement)      |
| `./contracts` | `WorkflowRunner`, `JobDispatcher`, `ContextStorage`                                                | the ports behind `ctx.run`, `ctx.signal`, `ctx.dispatch`, the context   |
| `./contracts` | `DeviceSequenceStore`, `OfflineCapStore`, `ReplicaLog`, `ReviewItemSink`, `ReviewReason`           | the offline stores and the review sink, with their types                |
| `./contracts` | `DeviceOrder`, `DeviceSequence`, `ReplicaRow`, `ReplicaChange`, `ReviewItem`                       | the device on the call, a device's last settled call, replica rows      |
| `./contracts` | `CallClient`                                                                                       | the network client on `ctx.client` (address, user agent)                |
| `./contracts` | `CallOrigin`, `CallOriginKind`                                                                     | the request origin on `ctx.origin` and the descriptor (ADR 0456)        |
| `./contracts` | `ConsentCheck`, `CallConsent`, `ConsentRefusal`                                                    | the consent snapshot check behind `ctx.consent()` (ADR 0472)            |
| `./node`      | `AsyncContextStorageDriver`                                                                        | `ContextStorage` over `AsyncLocalStorage`                               |
| `./testing`   | `run`, `fakeActionContext`, `fakeExtensionContext`, `extension`, `toHaveAudited`, `grantedConsent` | call through the real pipeline; fake contexts; inline extensions        |
| `./testing`   | `expectScopeCacheSafe`, `ScopeCacheSafeOptions`                                                    | a `per: CacheScope.Scope` query answers every caller the same           |

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
approval and idempotency, rate limit, interceptors, the query cache, then `handle` (an action's in its `UnitOfWork`, with its usage
event and its success audit entry, all inside the `LimitReservation` when one is bound: reserve, then commit), then the
`afterCommit` work. A refusal's audit entry is written after the rollback. A step whose port nobody binds is skipped,
except permission, which fails closed. Approval runs only when an `ApprovalGate` is bound; an action that declares
`approval: true` fails closed without one (ADR 0397 as amended by STA-813). An action that declares
`stepUp: AssuranceLevel.Aal2` (`AssuranceLevel` and the meter's `MeterKind` are `@stackra/contracts`', shared with
identity and model) is checked right after the permission by the bound `StepUpCheck` (a driver over
`@stackra/identity`'s `requireAssurance`) against `CallOptions.assurance` (`amr`, `authTime`, `level` from the verified
token), and fails closed without one; handlers read the same facts as `ctx.assurance`. An action that declares
`timeout: Duration.minutes(2)` hands it to `UnitOfWork.transaction(work, { timeout })`, so the database driver bounds
each statement of that transaction by it instead of the configured session timeout.

The rate-limit step takes one token from the call's area bucket, keyed by (app, scope): `area:<area>:<app>[:<scope>]`,
where the app is the origin's id (storefront, API key, agent) or, without one, the actor (ADR 0217 decision 2). It also
takes one from the action's own `rateLimit`. When a `RateLimitBudget` is bound and answers a bucket for the call, that
bucket sizes the area bucket (sized by the plan); `@stackra/entitlements` binds `EntitlementRateLimitBudgetDriver`
over the value entitlements `rate_limit.<area>_per_minute` and `rate_limit.<area>_burst` (ADR 0408). When it answers
`undefined`, or none is bound, the area's `RateLimitConfig` entry applies. The key does not change with the plan, so a
plan change resizes the same bucket.

A refusal is `RateLimitedError` with the refusing bucket's `retryAfterMs` (absent when it never refills), `limit` and
`remaining`, which travel as the envelope's `details` (the MCP answer) and become `Retry-After` and `RateLimit-*`
through `rateLimitHeaders` of `@stackra/errors` (the generated HTTP adapter). When an `EventOutbox` is bound, each
refusal also writes one `count` usage event on the meter `actions.rate_limited`: limits are metered.

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

The transport also sets the request origin (ADR 0456 decision 1): `CallOptions.origin` is a `CallOrigin`, a
`CallOriginKind` (`storefront`, `console`, `api_key`, `agent`) and the public id of the storefront, API key or agent,
read from the verified credential. Unlike the client it is no personal data, so it rides on `CallDescriptor.origin`:
the audit entry carries it, an AI attribution reads it, a storefront binds its keys to it, and a handler reads
`ctx.origin`. An internal call (a job, a workflow step) has none.

The visitor's consent reaches the server as a signed snapshot (ADR 0472): the transport passes the `Stackra-Consent`
header as sent in `CallOptions.consentSnapshot`, and `await ctx.consent()` verifies it once per call through the
`ConsentCheck` port (`SnapshotConsentCheckDriver` of `@stackra/consent`). The answer is a `CallConsent`: verified,
with the snapshot id, subject, granted categories and expiry, or refused with a `ConsentRefusal` (`missing`,
`unchecked` when no check is bound, `malformed`, `untrusted_key`, `bad_signature`, `not_yet_valid`, `expired`,
`policy_outdated`, `global_privacy_control`) and nothing granted. It adds no pipeline step and never refuses the call:
a server-side send (analytics, a conversion, an audience push) runs only when `granted` includes its category. In a
unit test, `fakeActionContext({ consent: grantedConsent("analytics") })`; the fake reads as refused otherwise.

When a `Tracer` (the `@stackra/contracts` port; the OTLP driver ships with the telemetry runtime) is bound, each
call runs in one span named `action <key>`, `query <key>` or `propose <key>` (ADR 0147 decision 3). It carries the
attribute names `action` (the key), `correlationId` (the call id), `actorType`, `actorId`, `scopeId` and `origin`, then
`outcome` (`ok`, `refused` with the refusal's `code`, or `error`) and `latencyMs`: ids and codes only, never input,
output or a person's data. Only an error that is not a refusal fails the span. With no tracer bound nothing changes.

An event a model owns is recorded on the model. One that no model owns (a near-expiry alert, a notice) is
`await ctx.publish(StockNearExpiry.create({ ... }))` from `handle` (ADR 0456 decision 2): the pipeline writes it
through the `EventOutbox` in the action's unit of work, with the call id as its correlation, so it leaves only if the
call commits. Only an `IntegrationEvent` is published; without a bound outbox the call fails.

A query whose response is not JSON (an iCalendar feed, a CSV) returns `rawBody(contentType, body, filename?)`; the
transport tests the output with `isRawBody` and sends the body as is with that content type. An ordinary output with
`contentType` and `body` fields stays JSON: only the `~raw` marker counts.

A query that declares `cache: { ttl, per?, invalidateOn? }` (ADR 0305 rule 31) is served from the `Cache` port of
`@stackra/cache` by the cache step, inside its interceptors, so they see a hit too and only `handle` is skipped;
callers of one key share one `handle` run. `per` says whom one entry is shared with: `CacheScope.Principal` (the
default: the caller, and whom it acts for), `CacheScope.Scope` (every caller in the call's scope node; prove it with
`expectScopeCacheSafe`) or `CacheScope.Site` (every caller of one storefront origin; gen refuses one that reads the
caller, `site_cache_reads_caller`). The key is `<Query>:<tenant>:<per>:<holder>:<fingerprint>`, the fingerprint
covering the input, locale, currency, market, time zone and sandbox flag. The entries sit in the shared cache
namespace and carry the tenant in their key, so `QueryCacheEvictorListener` (subscribed by `registerCachedQueries`,
which gen calls for every query with `invalidateOn`) forgets every entry of the event's tenant after the event commits,
whichever scope node wrote it; `handle` still runs in the call's own context. With no `Cache` bound the step does not
run. Answers are stored as they are, so a network cache driver keeps plain data only (a `Date` comes back a string).

An action or query that declares `analytics` writes one `analytics.tracked.v1` event (`AnalyticsTracked`) through the
`EventOutbox`, the analytics stream of ADR 0216 decision 1, and `@stackra/analytics/node`'s
`RelayTrackedAnalyticsListener` sends it to the server destinations as an `AnalyticsDelivery`. `analytics: true` writes
`action.called` with the key, outcome (`ok`, or `refused` with its code), duration and origin; `analytics: LeadSubmitted`
(an `AnalyticsEvent` class) writes that event on success with only its declared fields, read from the output, then the
input. An action's success writes it in its unit of work (a rollback tracks nothing); a refusal and a query write it
after the call; an idempotent replay writes none. It is written only when `ctx.consent()` is verified and grants
`analytics` (ADR 0472): the consent subject is the event's anonymous id, a user actor's id its user id. Output that does
not fit the event's schema skips it with an `actions.analytics_skipped` warning; analytics never fails a call.

A query that declares `reads: "replica"` runs its `handle` on a database read replica through the `ReplicaReads` port
(`DatabaseReplicaReadsDriver` of `@stackra/database`, over `Database.onReplica`); the default `"primary"` never does,
and neither does any query with no `ReplicaReads` bound. Read-your-writes: each committed action records its writer
(`<scope>:<actor>`), and that writer's replica queries read the primary until the window closes (`DatabaseConfig`
`readYourWrites`, 5 seconds by default). The driver's memory is per instance, so the transport also carries the last
write as `CallOptions.lastWriteAt` (a short-lived cookie or header set on a committed action's answer). A forged value
only costs a replica read. `reads` is not the offline `replica` option.

`queryBudget` (on `Action` and `Query`) is the most database statements one call's `handle` may run. When a
`QueryBudget` is bound (`DatabaseQueryBudgetDriver` of `@stackra/database`) the pipeline runs `handle` inside it: a call
over its budget, or one that runs one statement shape more than the configured repeats (an N+1 loop), is reported with
its key, as a warning in production and a failure in strict mode. With none bound nothing is counted.

`ctx.memo(key, load)` is the call's request memo: the first read of a key runs `load`, every later read in the same call
shares the answer (a rejected load is forgotten). Nothing outlives the call, so put the scope or any id the answer
depends on in the key.

```ts
const rates = await ctx.memo(`fx:${currency}`, () => this.rates.today(currency));
```

An action that also runs as a job declares `job: { queue, unique, timeout, retries, backoff, cron }` (`backoff` is the
contracts `Backoff` curve); `cron: { schedule,
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
  Its event ids, and the pipeline's, come from `@stackra/contracts`' `mintPublicId("evt")` (STA-1380).
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
  `liveQueryRoutes` derives) never arrives first. A read returns only entries within the caller's scope, plus a
  change recorded with `cascade: true` at the caller's node or above it (ADR 0456 decision 3): a lot recall placed on
  a legal entity reaches each till below it on its next incremental refresh, not only on a full fill. The memory log
  honours it; the Postgres log of `@stackra/outbox` needs the same filter (handed over).

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

## Devtools

`@stackra/actions/devtools` is the dev-only entry (ADR 0246 decision 4). `defineActionsDevtools(kit)` defines the
`actions.registry` tab: each action and query gen registered, as `{ key, kind, type, permission, risk, effects, input
}` (names only), read when a host opens it. It returns the tab's remover. The kit is taken by shape (`DevtoolsTabSink`
from `@stackra/container/devtools`).

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

// a query cached per scope node: every caller that may read it gets the same answer (the cache step is off here)
await expectScopeCacheSafe(
  GetPriceListQuery,
  { listId },
  { as: [actors.owner(), actors.cashier()], scope },
);

createTestingModule(OrdersModule).withExtensions([
  extension(OrderExtensionPoint, "adjustTotals", { order: 10 }, (totals) => discounted(totals)),
]);
```
