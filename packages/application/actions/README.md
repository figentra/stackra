# @stackra/actions

Stackra actions: the `Action`, `Query`, `Precondition`, `ExtensionPoint`, `Extension` and `Interceptor` kind bases, the
fixed action pipeline, the idempotency and rate-limit stores behind ports, `RequestContext`, the `RateLimitConfig`
configuration and the action testing helpers.

**Tier:** `tier:lib` (`packages/application/actions`). Entries `.`, `./contracts`, `./node` and `./testing`. Depends on
`@stackra/contracts`, `@stackra/container`, `@stackra/config`, `@stackra/errors`, `@stackra/events` and
`@stackra/validation`; `@stackra/testing` is an optional peer of `./testing`. It never imports `@stackra/iam`,
`@stackra/workflow`, `@stackra/queue` or `@stackra/database`: those implement its ports.

## What is here

| Entry         | Symbol                                                                                 | Use                                                                     |
| ------------- | -------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- |
| `.`           | `Action`, `ActionContext`                                                              | `extends Action({ key, actors, ... })`, `handle(input, ctx)`            |
| `.`           | `Query`, `QueryContext`                                                                | `extends Query({ key, actors, ... })`, `handle(input, ctx)`             |
| `.`           | `Precondition`, `PreconditionContext`                                                  | `extends Precondition`, `check(ctx)`; listed in `preconditions`         |
| `.`           | `ExtensionPoint`, `Extension`, `ExtensionContext`, `ExtensionTable`                    | slots `after<V, A>()` and `before<A>()`; `Extension<Point["slot"]>`     |
| `.`           | `Interceptor`                                                                          | `extends Interceptor`, `intercept(ctx, next)`; listed in `interceptors` |
| `.`           | `Idempotency`, `OfflineMode`, `IdMinting`, `OfflinePrecondition`, `ConflictResolution` | the enums of the `idempotency` and `offline` options                    |
| `.`           | `ActionPipeline`, `PipelineStage`, `RequestContext`                                    | the runtime: the fixed steps, their names, the running call's context   |
| `.`           | `RateLimitConfig`, `RateLimitConfig$`                                                  | the per-area token buckets (key `actions.rate_limit`)                   |
| `.`           | `MemoryIdempotencyStoreDriver`, `MemoryRateLimitStoreDriver`                           | the in-process stores                                                   |
| `.`           | `registerActions`, `registerExtensions`, `connectExtensions`                           | what gen's entry and the runtime call at boot                           |
| `./contracts` | `AccessControl`, `TenancyCheck`, `EntitlementCheck`, `FlagCheck`                       | the ports of the pipeline's checks                                      |
| `./contracts` | `IdempotencyStore`, `RateLimitStore`, `UnitOfWork`, `AuditTrail`                       | the ports of its stores and its transaction                             |
| `./contracts` | `WorkflowRunner`, `JobDispatcher`, `ContextStorage`                                    | the ports behind `ctx.run`, `ctx.signal`, `ctx.dispatch`, the context   |
| `./node`      | `AsyncContextStorageDriver`                                                            | `ContextStorage` over `AsyncLocalStorage`                               |
| `./testing`   | `run`, `fakeActionContext`, `fakeExtensionContext`, `extension`                        | call through the real pipeline; fake contexts; inline extensions        |

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
