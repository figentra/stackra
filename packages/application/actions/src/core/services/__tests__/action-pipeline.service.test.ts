/**
 * Stackra file contract:
 * Purpose: unit tests of `ActionPipeline`: the fixed order of the steps; the actor check and fail-closed permission;
 *          input validation from a registered schema; idempotency (required, replayed, reused, derived, released on
 *          failure); the area and action rate limits; the unit of work with `afterCommit`; the audit entry; the call
 *          context (frozen clock, request facts, registered key, the call's scope, `RequestContext`); the workflow,
 *          signal and job capabilities (the dispatcher sees the scope); interceptors; and a query's lighter path.
 * Boundary: test only; every port is a stand-in driver in a map resolver, so each step is observed directly.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0138 (as amended); ADR 0136 (decisions 1 to 3 and 5); ADR 0305
 *                     (rule 24); ADR 0217 (decision 2); ADR 0327 (decision 6).
 */
import { type AnyClass, Driver } from "@stackra/container";
import {
  type Actor,
  ActorKind,
  Clock,
  Duration,
  Logger,
  Realm,
  type ScopeRef,
} from "@stackra/contracts";
import {
  ErrorKind,
  ForbiddenError,
  IdempotencyKeyReusedError,
  RateLimitedError,
  Refusal,
} from "@stackra/errors";
import { describe, expect, it } from "@stackra/testing";
import { registerSchemas, Schema } from "@stackra/validation";
import { z } from "zod";

import { RateLimitConfig } from "#config/rate-limit.config";
import {
  AccessControl,
  AuditTrail,
  ContextStorage,
  EntitlementCheck,
  FlagCheck,
  IdempotencyStore,
  JobDispatcher,
  RateLimitStore,
  TenancyCheck,
  UnitOfWork,
  WorkflowRunner,
} from "#contracts/index";
import type { AuditEntry, CallDescriptor } from "#contracts/index";
import { Action } from "#core/bases/action.base";
import { Interceptor } from "#core/bases/interceptor.base";
import { Precondition } from "#core/bases/precondition.base";
import { Query } from "#core/bases/query.base";
import { MemoryIdempotencyStoreDriver } from "#core/drivers/memory-idempotency-store.driver";
import { MemoryRateLimitStoreDriver } from "#core/drivers/memory-rate-limit-store.driver";
import { Idempotency } from "#core/enums/idempotency.enum";
import { IdempotencyKeyRequiredError } from "#core/errors/idempotency-key-required.error";
import { InputInvalidError } from "#core/errors/input-invalid.error";
import { registerActions } from "#core/functions/register-actions.function";
import { ActionPipeline } from "#core/services/action-pipeline.service";
import { RequestContext } from "#core/services/request-context.service";
import type { ActionContext } from "#core/types/action-context.type";
import type { QueryContext } from "#core/types/query-context.type";
import type { Resolver } from "#core/types/resolver.type";
import { AsyncContextStorageDriver } from "#node/drivers/async-context-storage.driver";

const NOW = new Date("2026-10-24T10:00:00.000Z");
const customer: Actor = {
  kind: ActorKind.User,
  id: "usr_1",
  realm: Realm.Customer,
  tenantId: "ten_1",
};
const agent: Actor = { kind: ActorKind.Agent, id: "agt_1", tenantId: "ten_1" };
const SCOPE: ScopeRef = { id: "scp_01j9z3k4m5n6p7q8r9s0t1v2w1", path: "platform.acme" };

/** Every step and handler appends here. */
let log: string[] = [];

class FixedClock extends Clock {
  now(): Date {
    return new Date(NOW);
  }
}

class RecordingAccess extends Driver(AccessControl) {
  readonly calls: CallDescriptor[] = [];

  denied = false;

  async require(call: CallDescriptor): Promise<void> {
    log.push("permission");
    this.calls.push(call);
    if (this.denied) throw ForbiddenError.create();
  }

  async authorize(_call: CallDescriptor, record: object): Promise<void> {
    if ("locked" in record) throw ForbiddenError.create();
  }
}

class LoggingTenancy extends Driver(TenancyCheck) {
  async check(): Promise<void> {
    log.push("tenancy");
  }
}

class LoggingEntitlements extends Driver(EntitlementCheck) {
  async check(): Promise<void> {
    log.push("entitlement");
  }
}

class LoggingFlags extends Driver(FlagCheck) {
  async check(): Promise<void> {
    log.push("flag");
  }
}

class OrdersPausedError extends Refusal({ kind: ErrorKind.FailedPrecondition }) {}

class OutOfStockError extends Refusal({ kind: ErrorKind.Conflict }) {}

class Shop {
  open = true;

  placed = 0;

  failNext = false;
}

class AcceptingOrdersPrecondition extends Precondition {
  readonly shop: Shop;

  constructor(shop: Shop) {
    super();
    this.shop = shop;
  }

  async check(): Promise<void> {
    log.push("precondition");
    if (!this.shop.open) throw OrdersPausedError.create();
  }
}

class TracingInterceptor extends Interceptor {
  async intercept(_ctx: QueryContext, next: () => Promise<unknown>): Promise<unknown> {
    log.push("interceptor:before");
    const output = await next();
    log.push("interceptor:after");
    return output;
  }
}

class CreateOrderInput extends Schema {
  quantity!: number;
}

registerSchemas([[CreateOrderInput, z.object({ quantity: z.number().int().min(1) })]]);

class CreateOrderAction extends Action({
  key: "order.create",
  actors: [ActorKind.User, ActorKind.Agent],
  preconditions: [AcceptingOrdersPrecondition],
  interceptors: [TracingInterceptor],
  idempotency: Idempotency.Required,
}) {
  readonly shop: Shop;

  constructor(shop: Shop) {
    super();
    this.shop = shop;
  }

  async handle(
    input: CreateOrderInput,
    ctx: ActionContext,
  ): Promise<{ orderId: string; key: string | undefined }> {
    log.push("handle");
    if (this.shop.failNext) {
      this.shop.failNext = false;
      throw OutOfStockError.create();
    }
    this.shop.placed += input.quantity;
    ctx.audit({ quantity: input.quantity });
    ctx.afterCommit(() => log.push("after-commit:1"));
    ctx.afterCommit(() => log.push("after-commit:2"));
    return { orderId: `ord_${this.shop.placed}`, key: ctx.idempotencyKey };
  }
}

class SendMessageAction extends Action({
  key: "message.send",
  actors: [ActorKind.User],
  idempotency: Idempotency.Derived,
  rateLimit: { perMinute: 1 },
}) {
  sent = 0;

  async handle(input: { text: string }): Promise<{ count: number; text: string }> {
    this.sent += 1;
    return { count: this.sent, text: input.text };
  }
}

class InspectAction extends Action({
  key: "order.inspect",
  actors: [ActorKind.User, ActorKind.Agent],
}) {
  async handle(input: { record?: object; fail?: boolean }, ctx: ActionContext): Promise<object> {
    if (input.record !== undefined) await ctx.authorize(input.record);
    ctx.afterCommit(() => {
      throw new Error("mail down");
    });
    return {
      now: ctx.now(),
      sameNow: ctx.now().getTime() === ctx.now().getTime(),
      key: ctx.key,
      locale: ctx.locale,
      timeZone: ctx.timeZone,
      currency: ctx.currency,
      market: ctx.market,
      tenantId: ctx.tenantId,
      scope: ctx.scope,
      startOfDay: ctx.startOfDay(),
      days: ctx.period({ range: "last_7_days" }).days,
    };
  }
}

class RedeemWorkflow {}

class Confirmed {}

class RedeemPointsAction extends Action({ key: "points.redeem", actors: [ActorKind.User] }) {
  async handle(input: { points: number }, ctx: ActionContext): Promise<unknown> {
    await ctx.signal(Confirmed, { reference: "r1" }, { reference: "r1" });
    await ctx.dispatch(SendMessageAction, { text: "redeemed" });
    return ctx.run<{ redeemed: number }>(RedeemWorkflow, input);
  }
}

class CurrentContextAction extends Action({ key: "order.current", actors: [ActorKind.User] }) {
  readonly request: RequestContext;

  constructor(request: RequestContext) {
    super();
    this.request = request;
  }

  async handle(_input: object, ctx: ActionContext): Promise<boolean> {
    await Promise.resolve();
    return this.request.current().callId === ctx.callId;
  }
}

class GetOrderQuery extends Query({
  key: "order.get",
  actors: [ActorKind.User],
  interceptors: [TracingInterceptor],
}) {
  async handle(
    input: { orderId: string },
    ctx: QueryContext,
  ): Promise<{ orderId: string; afterCommit: boolean }> {
    log.push("handle");
    return { orderId: input.orderId, afterCommit: "afterCommit" in ctx };
  }
}

class DoubleNextInterceptor extends Interceptor {
  async intercept(_ctx: QueryContext, next: () => Promise<unknown>): Promise<unknown> {
    await next();
    return next();
  }
}

class TwiceQuery extends Query({
  key: "order.twice",
  actors: [ActorKind.User],
  interceptors: [DoubleNextInterceptor],
}) {
  async handle(): Promise<number> {
    return 1;
  }
}

class Transactions extends Driver(UnitOfWork) {
  async transaction<T>(work: () => Promise<T>): Promise<T> {
    log.push("begin");
    try {
      const output = await work();
      log.push("commit");
      return output;
    } catch (error) {
      log.push("rollback");
      throw error;
    }
  }
}

class Trail extends Driver(AuditTrail) {
  readonly entries: AuditEntry[] = [];

  async record(entry: AuditEntry): Promise<void> {
    this.entries.push(entry);
  }
}

class Lines extends Driver(Logger) {
  readonly errors: [string, Readonly<Record<string, unknown>> | undefined][] = [];

  debug(): void {}

  info(): void {}

  warn(): void {}

  error(event: string, fields?: Readonly<Record<string, unknown>>): void {
    this.errors.push([event, fields]);
  }
}

class Workflows extends Driver(WorkflowRunner) {
  readonly signals: unknown[] = [];

  async run(workflow: AnyClass, input: unknown, call: CallDescriptor): Promise<unknown> {
    return { workflow: workflow.name, input, parent: call.key };
  }

  async signal(signal: AnyClass, payload: object): Promise<void> {
    this.signals.push([signal.name, payload]);
  }
}

class Jobs extends Driver(JobDispatcher) {
  readonly queued: unknown[] = [];

  readonly scopes: (ScopeRef | undefined)[] = [];

  async dispatch(action: AnyClass, input: unknown, call: CallDescriptor): Promise<void> {
    this.queued.push([action.name, input]);
    this.scopes.push(call.scope);
  }
}

/** A resolver over instances, keyed by the class (or port) given. */
function resolverOf(entries: readonly (readonly [AnyClass, object])[]): Resolver {
  const map = new Map<AnyClass, object>(entries);
  return {
    has: (token) => map.has(token),
    get: <T extends object>(token: AnyClass<T>): T => {
      const instance = map.get(token);
      if (instance === undefined) throw new Error(`${token.name} is not bound`);
      return instance as T;
    },
  };
}

/** A pipeline with every step bound, and the stand-ins to inspect. */
function setup(extra: readonly (readonly [AnyClass, object])[] = []) {
  log = [];
  const shop = new Shop();
  const access = new RecordingAccess();
  const trail = new Trail();
  const lines = new Lines();
  const send = new SendMessageAction();
  const workflows = new Workflows();
  const jobs = new Jobs();
  const storage = new AsyncContextStorageDriver();
  const resolver = resolverOf([
    [Clock, new FixedClock()],
    [AccessControl, access],
    [TenancyCheck, new LoggingTenancy()],
    [EntitlementCheck, new LoggingEntitlements()],
    [FlagCheck, new LoggingFlags()],
    [IdempotencyStore, new MemoryIdempotencyStoreDriver(new FixedClock())],
    [RateLimitStore, new MemoryRateLimitStoreDriver()],
    [UnitOfWork, new Transactions()],
    [AuditTrail, trail],
    [Logger, lines],
    [ContextStorage, storage],
    [AcceptingOrdersPrecondition, new AcceptingOrdersPrecondition(shop)],
    [TracingInterceptor, new TracingInterceptor()],
    [DoubleNextInterceptor, new DoubleNextInterceptor()],
    [CreateOrderAction, new CreateOrderAction(shop)],
    [SendMessageAction, send],
    [InspectAction, new InspectAction()],
    [RedeemPointsAction, new RedeemPointsAction()],
    [CurrentContextAction, new CurrentContextAction(new RequestContext(storage))],
    [GetOrderQuery, new GetOrderQuery()],
    [TwiceQuery, new TwiceQuery()],
    [WorkflowRunner, workflows],
    [JobDispatcher, jobs],
    ...extra,
  ]);
  return {
    pipeline: new ActionPipeline(resolver),
    shop,
    access,
    trail,
    lines,
    send,
    workflows,
    jobs,
  };
}

describe(ActionPipeline, () => {
  it("runs the steps in the fixed order, the handler in the unit of work, after-commit work last", async () => {
    const { pipeline } = setup();
    const output = await pipeline.execute(
      CreateOrderAction,
      { quantity: 2 },
      { actor: customer, idempotencyKey: "k1" },
    );
    expect(output).toEqual({ orderId: "ord_2", key: "k1" });
    expect(log).toEqual([
      "tenancy",
      "permission",
      "precondition",
      "entitlement",
      "flag",
      "interceptor:before",
      "begin",
      "handle",
      "commit",
      "interceptor:after",
      "after-commit:1",
      "after-commit:2",
    ]);
  });

  it("refuses an actor kind the action does not list, before the permission", async () => {
    const { pipeline } = setup();
    const service: Actor = { kind: ActorKind.Service, id: "svc_notifications" };
    await expect(
      pipeline.execute(CreateOrderAction, { quantity: 1 }, { actor: service, idempotencyKey: "k" }),
    ).rejects.toBeInstanceOf(ForbiddenError);
    expect(log).toEqual(["tenancy"]);
  });

  it("fails closed without an AccessControl, and refuses what it denies", async () => {
    const empty = new ActionPipeline(resolverOf([[GetOrderQuery, new GetOrderQuery()]]));
    await expect(
      empty.execute(GetOrderQuery, { orderId: "ord_1" }, { actor: customer }),
    ).rejects.toThrow(/AccessControl is not bound/);
    const { pipeline, access } = setup();
    access.denied = true;
    await expect(
      pipeline.execute(GetOrderQuery, { orderId: "ord_1" }, { actor: customer }),
    ).rejects.toBeInstanceOf(ForbiddenError);
    expect(log).not.toContain("handle");
  });

  it("refuses through a precondition before entitlement, flag and handle", async () => {
    const { pipeline, shop } = setup();
    shop.open = false;
    await expect(
      pipeline.execute(
        CreateOrderAction,
        { quantity: 1 },
        { actor: customer, idempotencyKey: "k" },
      ),
    ).rejects.toBeInstanceOf(OrdersPausedError);
    expect(log).toEqual(["tenancy", "permission", "precondition"]);
  });

  it("hands AccessControl the registered identity and validates the registered input", async () => {
    registerActions([
      {
        type: CreateOrderAction,
        key: "orders.order.create@1",
        permission: "orders.order.create",
        risk: "L1",
        input: CreateOrderInput,
      },
    ]);
    const { pipeline, access } = setup();
    await pipeline.execute(
      CreateOrderAction,
      { quantity: 1 },
      { actor: customer, idempotencyKey: "k1" },
    );
    expect(access.calls[0]).toMatchObject({
      key: "orders.order.create@1",
      permission: "orders.order.create",
      risk: "L1",
      kind: "action",
      tenantId: "ten_1",
      area: "app",
    });
    await expect(
      pipeline.execute(
        CreateOrderAction,
        { quantity: 0 },
        { actor: customer, idempotencyKey: "k2" },
      ),
    ).rejects.toMatchObject({
      code: "input_invalid",
      fieldErrors: { quantity: expect.any(String) },
    });
    await expect(
      pipeline.execute(
        CreateOrderAction,
        { quantity: 0 },
        { actor: customer, idempotencyKey: "k2" },
      ),
    ).rejects.toBeInstanceOf(InputInvalidError);
  });

  it("requires a key, replays a repeated key and refuses a reused one", async () => {
    const { pipeline, shop } = setup();
    await expect(
      pipeline.execute(CreateOrderAction, { quantity: 1 }, { actor: customer }),
    ).rejects.toBeInstanceOf(IdempotencyKeyRequiredError);
    const first = await pipeline.execute(
      CreateOrderAction,
      { quantity: 1 },
      { actor: customer, idempotencyKey: "k1" },
    );
    const again = await pipeline.execute(
      CreateOrderAction,
      { quantity: 1 },
      { actor: customer, idempotencyKey: "k1" },
    );
    expect(again).toEqual(first);
    expect(shop.placed).toBe(1);
    await expect(
      pipeline.execute(
        CreateOrderAction,
        { quantity: 5 },
        { actor: customer, idempotencyKey: "k1" },
      ),
    ).rejects.toBeInstanceOf(IdempotencyKeyReusedError);
    const other = await pipeline.execute(
      CreateOrderAction,
      { quantity: 1 },
      { actor: agent, idempotencyKey: "k1" },
    );
    expect(other).toEqual({ orderId: "ord_2", key: "k1" });
  });

  it("releases the key of a refused call so the retry runs", async () => {
    const { pipeline, shop } = setup();
    shop.failNext = true;
    await expect(
      pipeline.execute(
        CreateOrderAction,
        { quantity: 1 },
        { actor: customer, idempotencyKey: "k1" },
      ),
    ).rejects.toBeInstanceOf(OutOfStockError);
    expect(log).toContain("rollback");
    expect(log).not.toContain("after-commit:1");
    expect(
      await pipeline.execute(
        CreateOrderAction,
        { quantity: 1 },
        { actor: customer, idempotencyKey: "k1" },
      ),
    ).toEqual({
      orderId: "ord_1",
      key: "k1",
    });
  });

  it("derives a key without one, then applies the action's own rate limit", async () => {
    const { pipeline, send } = setup();
    const first = await pipeline.execute(SendMessageAction, { text: "hi" }, { actor: customer });
    const replay = await pipeline.execute(SendMessageAction, { text: "hi" }, { actor: customer });
    expect(replay).toEqual(first);
    expect(send.sent).toBe(1);
    await expect(
      pipeline.execute(SendMessageAction, { text: "again" }, { actor: customer }),
    ).rejects.toBeInstanceOf(RateLimitedError);
  });

  it("applies the area's bucket from RateLimitConfig, and needs a store for a declared limit", async () => {
    const config = Object.assign(new RateLimitConfig(), {
      areas: { app: { requests: 1, per: Duration.minutes(1), burst: 1 } },
    });
    const { pipeline } = setup([[RateLimitConfig, config]]);
    await pipeline.execute(GetOrderQuery, { orderId: "ord_1" }, { actor: customer });
    await expect(
      pipeline.execute(GetOrderQuery, { orderId: "ord_1" }, { actor: customer }),
    ).rejects.toBeInstanceOf(RateLimitedError);
    const bare = new ActionPipeline(
      resolverOf([
        [AccessControl, new RecordingAccess()],
        [IdempotencyStore, new MemoryIdempotencyStoreDriver(new FixedClock())],
        [SendMessageAction, new SendMessageAction()],
      ]),
    );
    await expect(
      bare.execute(SendMessageAction, { text: "hi" }, { actor: customer }),
    ).rejects.toThrow(/RateLimitStore/);
  });

  it("audits an action's outcome and fields, never a query", async () => {
    const { pipeline, shop, trail } = setup();
    await pipeline.execute(
      CreateOrderAction,
      { quantity: 3 },
      { actor: customer, idempotencyKey: "k1" },
    );
    shop.open = false;
    await expect(
      pipeline.execute(
        CreateOrderAction,
        { quantity: 1 },
        { actor: customer, idempotencyKey: "k2" },
      ),
    ).rejects.toBeInstanceOf(OrdersPausedError);
    await pipeline.execute(GetOrderQuery, { orderId: "ord_1" }, { actor: customer });
    expect(trail.entries.map(({ outcome, code, fields }) => ({ outcome, code, fields }))).toEqual([
      { outcome: "ok", code: undefined, fields: { quantity: 3 } },
      { outcome: "refused", code: "orders_paused", fields: {} },
    ]);
    expect(trail.entries[0]?.at).toEqual(NOW);
  });

  it("builds the context: frozen clock, request facts, key, tenant, scope, period; logs a failed after-commit", async () => {
    const { pipeline, lines, access } = setup();
    const output = await pipeline.execute(
      InspectAction,
      {},
      {
        actor: customer,
        scope: SCOPE,
        locale: "ar-SA",
        timeZone: "Asia/Riyadh",
        currency: "SAR",
        market: "sa",
      },
    );
    expect(output).toEqual({
      now: NOW,
      sameNow: true,
      key: "order.inspect",
      locale: "ar-SA",
      timeZone: "Asia/Riyadh",
      currency: "SAR",
      market: "sa",
      tenantId: "ten_1",
      scope: SCOPE,
      startOfDay: new Date("2026-10-23T21:00:00.000Z"),
      days: 7,
    });
    expect(access.calls[0]?.scope).toEqual(SCOPE);
    expect(lines.errors).toEqual([
      [
        "actions.after_commit_failed",
        expect.objectContaining({ key: "order.inspect", cause: expect.any(Error) }),
      ],
    ]);
    const defaults = (await pipeline.execute(InspectAction, {}, { actor: agent })) as {
      locale: string;
      currency: string;
      scope?: ScopeRef;
    };
    expect(defaults.scope).toBeUndefined();
    expect(access.calls[1]).not.toHaveProperty("scope");
    expect(defaults).toMatchObject({
      locale: "en",
      currency: "USD",
      market: "default",
      timeZone: "UTC",
    });
    await expect(
      pipeline.execute(InspectAction, { record: { locked: true } }, { actor: customer }),
    ).rejects.toBeInstanceOf(ForbiddenError);
  });

  it("reaches the workflow runner and the job dispatcher, and needs them bound", async () => {
    const { pipeline, workflows, jobs } = setup();
    expect(
      await pipeline.execute(RedeemPointsAction, { points: 5 }, { actor: customer, scope: SCOPE }),
    ).toEqual({
      workflow: "RedeemWorkflow",
      input: { points: 5 },
      parent: "points.redeem",
    });
    expect(workflows.signals).toEqual([["Confirmed", { reference: "r1" }]]);
    expect(jobs.queued).toEqual([["SendMessageAction", { text: "redeemed" }]]);
    expect(jobs.scopes).toEqual([SCOPE]);
    const bare = new ActionPipeline(
      resolverOf([
        [AccessControl, new RecordingAccess()],
        [RedeemPointsAction, new RedeemPointsAction()],
      ]),
    );
    await expect(
      bare.execute(RedeemPointsAction, { points: 1 }, { actor: customer }),
    ).rejects.toThrow(/WorkflowRunner is not bound/);
  });

  it("runs each call inside the context storage, so RequestContext answers", async () => {
    const { pipeline } = setup();
    expect(await pipeline.execute(CurrentContextAction, {}, { actor: customer })).toBe(true);
  });

  it("runs a query without preconditions, transaction or after-commit, and refuses next() twice", async () => {
    const { pipeline } = setup();
    expect(
      await pipeline.execute(GetOrderQuery, { orderId: "ord_9" }, { actor: customer }),
    ).toEqual({
      orderId: "ord_9",
      afterCommit: false,
    });
    expect(log).toEqual([
      "tenancy",
      "permission",
      "entitlement",
      "flag",
      "interceptor:before",
      "handle",
      "interceptor:after",
    ]);
    await expect(pipeline.execute(TwiceQuery, {}, { actor: customer })).rejects.toThrow(
      /next\(\) twice/,
    );
  });

  it("refuses a class that is neither an action nor a query", async () => {
    const { pipeline } = setup();
    class OrderService {}
    await expect(
      pipeline.execute(
        OrderService as unknown as typeof GetOrderQuery,
        { orderId: "x" },
        { actor: customer },
      ),
    ).rejects.toThrow(TypeError);
  });
});
