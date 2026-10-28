/**
 * Stackra file contract:
 * Purpose: unit tests of `ActionPipeline`: the fixed order of the steps; the actor check and fail-closed permission;
 *          input validation from a registered schema; idempotency (required, replayed, reused, derived, released on
 *          failure); the area and action rate limits (the area bucket plan-sized by `RateLimitBudget`, keyed by (app, scope), a refusal
 *          with its back-off details and a `rate_limited` usage event); the unit of work with `afterCommit`; the audit entry; the call
 *          context (frozen clock, request facts, registered key, the call's scope, `RequestContext`); the workflow,
 *          signal and job capabilities (the dispatcher sees the scope); interceptors; a query's lighter path; and the
 *          offline additions: a device's calls in sequence order (sequences are not contiguous; refusals settle; a
 *          resend replays or is refused; a call with no sequence is not ordered and reads `ctx.deviceId`), the offline
 *          cap by count and amount, the review of offline-computed documents, and a replica query's full fill and the
 *          changes since the cursor in its input; and the governance additions: the approval step before idempotency,
 *          the live-configuration guard of a structural action, the meter's usage event inside the unit of work, the
 *          cap's amount field, and the registered effect tags on the descriptor; and the remainder (STA-765): the
 *          approval step runs only with a gate bound unless the action declares `approval` (STA-813), the limit
 *          reservation wraps the unit of work, a successful call's audit entry is written inside it, and written effect
 *          tags reach the descriptor; and the step-up check with `ctx.assurance` (STA-814); and the sandbox flag on the
 *          descriptor and the context, and the network client on the context only (STA-1248); and the request origin
 *          on the descriptor, the audit entry and the context, and `ctx.publish` of an integration event without a
 *          model inside the unit of work (ADR 0456); and the query cache step (STA-1445): a hit inside the
 *          interceptors, keys per principal, scope node and site, the shared namespace with `handle` in the call's
 *          context, and no step without a bound `Cache`; and `ctx.consent()` (ADR 0472): refused without a snapshot or
 *          a bound `ConsentCheck`, the check's answer otherwise, verified once per call, never refusing the call; and
 *          the `Tracer` span per call (ADR 0147, STA-1513): its name, the attribute names with no input values, the
 *          outcome of a success, a refusal and a bug, a proposal's span, and no span without a bound tracer.
 * Boundary: test only; every port is a stand-in driver in a map resolver, so each step is observed directly; the
 *           offline stores are the memory drivers.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0138 (as amended); ADR 0136 (decisions 1 to 3 and 5); ADR 0305
 *                     (rule 24); ADR 0217 (decision 2); ADR 0327 (decision 6); ADR 0338 (decisions 1, 3 and 5); ADR
 *                     0337 (decisions 4 and 5); ADR 0456 (decisions 1 and 2).
 */
import { Cache } from "@stackra/cache/contracts";
import type { CacheKey } from "@stackra/cache";
import { type AnyClass, Driver } from "@stackra/container";
import {
  type Actor,
  ActorKind,
  AssuranceLevel,
  Clock,
  Duration,
  Enum,
  Logger,
  MeterKind,
  Realm,
  type ScopeRef,
  type TraceAttributes,
  type TraceSpan,
  Tracer,
} from "@stackra/contracts";
import {
  ErrorKind,
  ForbiddenError,
  IdempotencyKeyReusedError,
  LiveReadOnlyError,
  RateLimitedError,
  Refusal,
} from "@stackra/errors";
import { DomainEvent, IntegrationEvent } from "@stackra/events";
import type { RecordedEvent } from "@stackra/events/contracts";
import { EventOutbox } from "@stackra/events/contracts";
import { describe, expect, it, onTestFinished } from "@stackra/testing";
import { registerSchemas, Schema } from "@stackra/validation";
import { z } from "zod";

import { RateLimitConfig } from "#config/rate-limit.config";
import {
  AccessControl,
  ApprovalGate,
  AuditTrail,
  ConsentCheck,
  ContextStorage,
  DeviceSequenceStore,
  EntitlementCheck,
  FlagCheck,
  IdempotencyStore,
  JobDispatcher,
  LimitReservation,
  LiveConfigurationGuard,
  OfflineCapStore,
  RateLimitBudget,
  RateLimitStore,
  ReplicaLog,
  ReviewItemSink,
  StepUpCheck,
  TenancyCheck,
  UnitOfWork,
  WorkflowRunner,
} from "#contracts/index";
import type {
  AuditEntry,
  CallAssurance,
  CallConsent,
  CallDescriptor,
  CallOrigin,
} from "#contracts/index";
import { ConsentRefusal } from "#contracts/enums/consent-refusal.enum";
import { CallOriginKind } from "#contracts/enums/call-origin-kind.enum";
import { Action } from "#core/bases/action.base";
import { Interceptor } from "#core/bases/interceptor.base";
import { Precondition } from "#core/bases/precondition.base";
import { Query } from "#core/bases/query.base";
import { CacheScope } from "#core/enums/cache-scope.enum";
import { MemoryDeviceSequenceStoreDriver } from "#core/drivers/memory-device-sequence-store.driver";
import { MemoryIdempotencyStoreDriver } from "#core/drivers/memory-idempotency-store.driver";
import { MemoryOfflineCapStoreDriver } from "#core/drivers/memory-offline-cap-store.driver";
import { MemoryRateLimitStoreDriver } from "#core/drivers/memory-rate-limit-store.driver";
import { MemoryReplicaLogDriver } from "#core/drivers/memory-replica-log.driver";
import { MemoryReviewItemSinkDriver } from "#core/drivers/memory-review-item-sink.driver";
import { OpenApprovalGateDriver } from "#core/drivers/open-approval-gate.driver";
import { Effect } from "#contracts/enums/effect.enum";
import { ConflictResolution } from "#core/enums/conflict-resolution.enum";
import { Idempotency } from "#core/enums/idempotency.enum";
import { IdMinting } from "#core/enums/id-minting.enum";
import { OfflineMode } from "#core/enums/offline-mode.enum";
import { OfflinePrecondition } from "#core/enums/offline-precondition.enum";
import { ApprovalRequiredError } from "#core/errors/approval-required.error";
import { DeviceSequenceOutOfOrderError } from "#core/errors/device-sequence-out-of-order.error";
import { IdempotencyKeyRequiredError } from "#core/errors/idempotency-key-required.error";
import { InputInvalidError } from "#core/errors/input-invalid.error";
import { OfflineCapReachedError } from "#core/errors/offline-cap-reached.error";
import { UsageRecorded } from "#core/events/usage-recorded.event";
import { registerActions } from "#core/functions/register-actions.function";
import { ActionPipeline } from "#core/services/action-pipeline.service";
import { ACTION_REGISTRY } from "#core/constants/action-registry.constant";
import { ReplicaFeed } from "#core/services/replica-feed.service";
import { RequestContext } from "#core/services/request-context.service";
import type { RuleEvaluation } from "#core/types/rule-evaluation.type";
import type { RuleEvaluator } from "#core/types/rule-evaluator.type";
import type { ActionContext } from "#core/types/action-context.type";
import type { QueryContext } from "#core/types/query-context.type";
import type { ReplicaPage } from "#core/types/replica-page.type";
import type { Resolver } from "#core/types/resolver.type";
import { AsyncContextStorageDriver } from "#node/drivers/async-context-storage.driver";

const NOW = new Date("2026-10-24T10:00:00.000Z");
const customer: Actor = {
  kind: ActorKind.User,
  id: "usr_1",
  realm: Realm.Customer,
  scopeId: "ten_1",
};
const agent: Actor = { kind: ActorKind.Agent, id: "agt_1", scopeId: "ten_1" };
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
  timeout: Duration.seconds(5),
}) {
  async handle(input: { record?: object; fail?: boolean }, ctx: ActionContext): Promise<object> {
    if (input.record !== undefined) await ctx.authorize(input.record);
    ctx.afterCommit(() => {
      throw new Error("mail down");
    });
    return {
      now: ctx.now(),
      // oxlint-disable-next-line no-self-compare -- reason: two calls, asserting the clock is fixed for the call
      sameNow: ctx.now().getTime() === ctx.now().getTime(),
      key: ctx.key,
      expectedVersion: ctx.expectedVersion,
      locale: ctx.locale,
      timeZone: ctx.timeZone,
      currency: ctx.currency,
      market: ctx.market,
      scopeId: ctx.scopeId,
      scope: ctx.scope,
      deviceId: ctx.deviceId,
      startOfDay: ctx.startOfDay(),
      days: ctx.period({ range: "last_7_days" }).days,
    };
  }
}

class RedeemWorkflow {}

class Confirmed {}

class RedeemPointsAction extends Action({
  key: "points.redeem",
  actors: [ActorKind.User],
}) {
  async handle(input: { points: number }, ctx: ActionContext): Promise<unknown> {
    await ctx.signal(Confirmed, { reference: "r1" }, { reference: "r1" });
    await ctx.dispatch(SendMessageAction, { text: "redeemed" });
    return ctx.run<{ redeemed: number }>(RedeemWorkflow, input);
  }
}

class CurrentContextAction extends Action({
  key: "order.current",
  actors: [ActorKind.User],
}) {
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

class RedeemGiftCardAction extends Action({
  key: "gift_card.redeem",
  actors: [ActorKind.User],
  offline: {
    mode: OfflineMode.Queue,
    idMinting: IdMinting.Client,
    precondition: OfflinePrecondition.None,
    retention: "72h",
    onConflict: [ConflictResolution.Manual],
    cap: { count: 2, amount: 5000, window: "24h" },
  },
}) {
  async handle(input: { amount: number | { minor: number; currency: string } }): Promise<object> {
    return { redeemed: input.amount };
  }
}

type SaleInput = { total?: number; ruleVersion?: string };

class SaleEvaluator implements RuleEvaluator<SaleInput> {
  async evaluate(input: SaleInput): Promise<RuleEvaluation | undefined> {
    log.push("evaluate");
    if (input.total === undefined || input.ruleVersion === undefined) return undefined;
    return {
      ruleVersion: input.ruleVersion,
      client: { total: input.total },
      server: { total: 950 },
    };
  }
}

class CompleteSaleAction extends Action({
  key: "sale.complete",
  actors: [ActorKind.User],
  accepts: { ruleVersion: "2.4.0", evaluator: SaleEvaluator },
}) {
  async handle(): Promise<{ saleId: string; total: number }> {
    log.push("handle");
    return { saleId: "sal_1", total: 950 };
  }
}

class Sale {}

class RecentSalesQuery extends Query({
  key: "sale.recent",
  actors: [ActorKind.User],
  replica: { of: Sale, window: "30d", limit: 50 },
}) {
  async handle(_input: { cursor?: string | null }, ctx: QueryContext): Promise<unknown> {
    return ctx.replica(async () => [{ id: "sal_1", at: NOW, data: { total: 1 } }]);
  }
}

class NotReplicaQuery extends Query({
  key: "sale.plain",
  actors: [ActorKind.User],
}) {
  async handle(_input: object, ctx: QueryContext): Promise<unknown> {
    return ctx.replica(async () => []);
  }
}

class Transactions extends Driver(UnitOfWork) {
  async transaction<T>(
    work: () => Promise<T>,
    options?: { readonly timeout?: Duration },
  ): Promise<T> {
    log.push(options?.timeout === undefined ? "begin" : `begin:${options.timeout}`);
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
    [ApprovalGate, new OpenApprovalGateDriver()],
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

  it("hands the unit of work the action's timeout, and none for an action without one", async () => {
    const { pipeline } = setup();
    await pipeline.execute(InspectAction, {}, { actor: customer });
    expect(log).toContain(`begin:${Duration.seconds(5)}`);
    log = [];
    await pipeline.execute(
      CreateOrderAction,
      { quantity: 1 },
      { actor: customer, idempotencyKey: "t" },
    );
    expect(log).toContain("begin");
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
    // the registry is module-wide: later tests expect the unregistered key "order.create"
    onTestFinished(() => {
      ACTION_REGISTRY.delete(CreateOrderAction);
    });
    registerActions([
      {
        type: CreateOrderAction,
        key: "orders.order.create@1",
        // oxlint-disable-next-line stackra/no-raw-key-literal -- reason: the test stands in for gen, which writes these registrations
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
      // oxlint-disable-next-line stackra/no-raw-key-literal -- reason: the test stands in for gen, which writes these registrations
      permission: "orders.order.create",
      risk: "L1",
      kind: "action",
      scopeId: "ten_1",
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
        [ApprovalGate, new OpenApprovalGateDriver()],
        [IdempotencyStore, new MemoryIdempotencyStoreDriver(new FixedClock())],
        [SendMessageAction, new SendMessageAction()],
      ]),
    );
    await expect(
      bare.execute(SendMessageAction, { text: "hi" }, { actor: customer }),
    ).rejects.toThrow(/RateLimitStore/);
  });

  it("sizes the area bucket from RateLimitBudget per scope, else from RateLimitConfig", async () => {
    const asked: CallDescriptor[] = [];
    class PlanBudget extends Driver(RateLimitBudget) {
      async areaBucket(call: CallDescriptor) {
        asked.push(call);
        return call.scopeId === "ten_1" ? { capacity: 2, tokensPerSecond: 0 } : undefined;
      }
    }
    const config = Object.assign(new RateLimitConfig(), {
      areas: { app: { requests: 1, per: Duration.minutes(1), burst: 1 } },
    });
    const { pipeline } = setup([
      [RateLimitConfig, config],
      [RateLimitBudget, new PlanBudget()],
    ]);
    const read = (actor: Actor) => pipeline.execute(GetOrderQuery, { orderId: "ord_1" }, { actor });
    await read(customer);
    await read(customer);
    await expect(read(customer)).rejects.toBeInstanceOf(RateLimitedError);
    expect(asked[0]).toMatchObject({ scopeId: "ten_1", area: "app" });
    const outsider: Actor = { ...customer, id: "usr_9", scopeId: "ten_9" };
    await read(outsider);
    await expect(read(outsider)).rejects.toBeInstanceOf(RateLimitedError);
  });

  it("keys the area bucket by (app, scope) and refuses with the bucket's back-off details", async () => {
    const config = Object.assign(new RateLimitConfig(), {
      areas: { app: { requests: 1, per: Duration.minutes(1), burst: 1 } },
    });
    const outbox = new Outbox();
    const { pipeline } = setup([
      [RateLimitConfig, config],
      [EventOutbox, outbox],
    ]);
    const read = (id: string) =>
      pipeline.execute(
        GetOrderQuery,
        { orderId: "ord_1" },
        { actor: customer, origin: { kind: CallOriginKind.ApiKey, id } },
      );
    await read("key_1");
    // Another app in the same scope has its own bucket.
    await read("key_2");
    await expect(read("key_1")).rejects.toMatchObject({
      code: "rate_limited",
      // One token a minute: about 60 seconds, rounded up by the store.
      retryAfterMs: expect.closeTo(60_000, -1),
      limit: 1,
      remaining: 0,
    });
    expect(outbox.written.at(-1)?.event).toMatchObject({
      meter: "actions.rate_limited",
      kind: MeterKind.Count,
      value: 1,
      key: "order.get",
    });
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
        expectedVersion: 4,
      },
    );
    expect(output).toEqual({
      now: NOW,
      sameNow: true,
      key: "order.inspect",
      expectedVersion: 4,
      locale: "ar-SA",
      timeZone: "Asia/Riyadh",
      currency: "SAR",
      market: "sa",
      scopeId: "ten_1",
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
    expect((defaults as { expectedVersion?: number }).expectedVersion).toBeUndefined();
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
        [ApprovalGate, new OpenApprovalGateDriver()],
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

  it("applies a device's calls in sequence order and settles a refused one", async () => {
    const devices = new MemoryDeviceSequenceStoreDriver();
    const { pipeline, shop } = setup([[DeviceSequenceStore, devices]]);
    const first = 1_729_760_400_000;
    const call = (sequence: number, key: string) =>
      pipeline.execute(
        CreateOrderAction,
        { quantity: 1 },
        {
          actor: customer,
          idempotencyKey: key,
          scope: SCOPE,
          device: { deviceId: "dev_1", sequence },
        },
      );
    expect(await call(first, "k1")).toEqual({ orderId: "ord_1", key: "k1" });
    expect(await devices.last("dev_1")).toMatchObject({
      sequence: first,
      settledAt: NOW,
      scope: SCOPE,
    });
    expect(await call(first, "k1")).toEqual({ orderId: "ord_1", key: "k1" });
    await expect(call(first, "k9")).rejects.toMatchObject({
      code: "device_sequence_out_of_order",
      acknowledged: first,
    });
    await expect(call(first - 5, "k8")).rejects.toBeInstanceOf(DeviceSequenceOutOfOrderError);
    shop.open = false;
    await expect(call(first + 7, "k2")).rejects.toBeInstanceOf(OrdersPausedError);
    expect((await devices.last("dev_1"))?.sequence).toBe(first + 7);
    shop.open = true;
    expect(await call(first + 9, "k3")).toEqual({ orderId: "ord_2", key: "k3" });
    await expect(call(0, "k0")).rejects.toMatchObject({
      code: "input_invalid",
      fieldErrors: { "device.sequence": "a whole number from 1" },
    });
    const bare = new ActionPipeline(
      resolverOf([
        [AccessControl, new RecordingAccess()],
        [ApprovalGate, new OpenApprovalGateDriver()],
        [InspectAction, new InspectAction()],
      ]),
    );
    expect(
      await bare.execute(InspectAction, {}, { actor: customer, device: { deviceId: "dev_1" } }),
    ).toMatchObject({ deviceId: "dev_1" });
    await expect(
      bare.execute(
        InspectAction,
        {},
        { actor: customer, device: { deviceId: "dev_1", sequence: 1 } },
      ),
    ).rejects.toThrow(/DeviceSequenceStore is not bound/);
  });

  it("reconciles a device's replayed calls against the offline cap, by count and by amount", async () => {
    const caps = new MemoryOfflineCapStoreDriver();
    const { pipeline } = setup([
      [DeviceSequenceStore, new MemoryDeviceSequenceStoreDriver()],
      [OfflineCapStore, caps],
      [RedeemGiftCardAction, new RedeemGiftCardAction()],
    ]);
    const redeem = (sequence: number, amount: unknown) =>
      pipeline.execute(RedeemGiftCardAction, { amount } as never, {
        actor: customer,
        device: { deviceId: "dev_1", sequence },
      });
    await redeem(1, 2000);
    await expect(redeem(2, 3500)).rejects.toBeInstanceOf(OfflineCapReachedError);
    await redeem(3, { minor: 3000, currency: "USD" });
    await expect(redeem(4, 1)).rejects.toMatchObject({ code: "offline_cap_reached" });
    expect(await caps.usage("dev_1", "gift_card.redeem", new Date(0))).toEqual({
      count: 2,
      amount: 5000,
    });
    await expect(redeem(5, "lots")).rejects.toBeInstanceOf(InputInvalidError);
    expect(
      await pipeline.execute(RedeemGiftCardAction, { amount: 9000 }, { actor: customer }),
    ).toEqual({ redeemed: 9000 });
  });

  it("reviews an offline-computed document that differs or is older, and never refuses it", async () => {
    const sink = new MemoryReviewItemSinkDriver();
    const { pipeline } = setup([
      [ReviewItemSink, sink],
      [SaleEvaluator, new SaleEvaluator()],
      [CompleteSaleAction, new CompleteSaleAction()],
    ]);
    const sell = (input: SaleInput) =>
      pipeline.execute(CompleteSaleAction, input, { actor: customer });
    expect(await sell({ total: 950, ruleVersion: "2.4.0" })).toEqual({
      saleId: "sal_1",
      total: 950,
    });
    expect(log).toEqual([
      "tenancy",
      "permission",
      "entitlement",
      "flag",
      "begin",
      "evaluate",
      "handle",
      "commit",
    ]);
    expect(await sell({ total: 900, ruleVersion: "2.4.1" })).toEqual({
      saleId: "sal_1",
      total: 950,
    });
    await sell({ total: 950, ruleVersion: "2.3.9" });
    await sell({});
    expect(
      sink.items.map(({ reason, ruleVersion, acceptedVersion, client, server, output }) => ({
        reason,
        ruleVersion,
        acceptedVersion,
        client,
        server,
        output,
      })),
    ).toEqual([
      {
        reason: "differs",
        ruleVersion: "2.4.1",
        acceptedVersion: "2.4.0",
        client: { total: 900 },
        server: { total: 950 },
        output: { saleId: "sal_1", total: 950 },
      },
      {
        reason: "older_rule_version",
        ruleVersion: "2.3.9",
        acceptedVersion: "2.4.0",
        client: { total: 950 },
        server: { total: 950 },
        output: { saleId: "sal_1", total: 950 },
      },
    ]);
    expect(sink.items[0]?.call.key).toBe("sale.complete");
  });

  it("answers a replica query with a full fill, then the changes since its cursor", async () => {
    const replicas = new MemoryReplicaLogDriver();
    const { pipeline } = setup([
      [ReplicaLog, replicas],
      [RecentSalesQuery, new RecentSalesQuery()],
      [NotReplicaQuery, new NotReplicaQuery()],
    ]);
    const first = (await pipeline.execute(
      RecentSalesQuery,
      { cursor: null },
      { actor: customer },
    )) as ReplicaPage;
    expect(first).toMatchObject({
      rows: [{ id: "sal_1", at: NOW, data: { total: 1 } }],
      removed: [],
      asOf: NOW,
      full: true,
    });
    const sale = { id: "sal_2", at: NOW, data: { total: 4 } };
    await new ReplicaFeed(replicas).record(RecentSalesQuery, [
      { id: "sal_2", row: sale },
      { id: "sal_1" },
    ]);
    expect(
      await pipeline.execute(RecentSalesQuery, { cursor: first.cursor }, { actor: customer }),
    ).toMatchObject({ rows: [sale], removed: ["sal_1"], full: false });
    await expect(pipeline.execute(NotReplicaQuery, {}, { actor: customer })).rejects.toThrow(
      /declares no replica/,
    );
    const bare = new ActionPipeline(
      resolverOf([
        [AccessControl, new RecordingAccess()],
        [RecentSalesQuery, new RecentSalesQuery()],
      ]),
    );
    await expect(bare.execute(RecentSalesQuery, {}, { actor: customer })).rejects.toThrow(
      /ReplicaLog is not bound/,
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

class PublishShellAction extends Action({
  key: "shell.publish",
  actors: [ActorKind.User],
  structural: true,
}) {
  async handle(): Promise<string> {
    log.push("handle");
    return "published";
  }
}

class RefundAction extends Action({
  key: "payment.refund",
  actors: [ActorKind.User],
  meter: { name: "payments.refunded", kind: MeterKind.Sum, field: "amount" },
}) {
  async handle(input: { amount: { minor: number; currency: string } }): Promise<number> {
    log.push("handle");
    return input.amount.minor;
  }
}

class SignInAction extends Action({
  key: "device.sign_in",
  actors: [ActorKind.User],
  meter: { name: "devices.active", kind: MeterKind.Unique, field: "deviceId" },
}) {
  async handle(): Promise<void> {}
}

class TopUpAction extends Action({
  key: "wallet.top_up",
  actors: [ActorKind.User],
  offline: {
    mode: OfflineMode.Queue,
    idMinting: IdMinting.Client,
    precondition: OfflinePrecondition.None,
    retention: "72h",
    onConflict: [ConflictResolution.Manual],
    cap: { amount: 1000, amountField: "total", window: "24h" },
  },
}) {
  async handle(): Promise<void> {}
}

registerActions([
  {
    type: RefundAction,
    key: "payments.payment.refund@1",
    // oxlint-disable-next-line stackra/no-raw-key-literal -- reason: the test stands in for gen, which writes these registrations
    permission: "payments.payment.refund",
    risk: "L3",
    effects: [Effect.Financial, Effect.Irreversible],
  },
]);

/** Parks every call unless it names the granted approval. */
class Approvals extends Driver(ApprovalGate) {
  readonly seen: [string, unknown, string | undefined][] = [];

  async check(call: CallDescriptor, input: unknown, approvalId: string | undefined): Promise<void> {
    log.push("approval");
    this.seen.push([call.key, input, approvalId]);
    if (approvalId !== "apr_granted")
      throw ApprovalRequiredError.create({ approvalId: "apr_parked" });
  }
}

/** A guard that answers live or sandbox. */
class Environments extends Driver(LiveConfigurationGuard) {
  live = true;

  async check(): Promise<void> {
    log.push("live-guard");
    if (this.live) throw LiveReadOnlyError.create();
  }
}

/** Keeps what the pipeline writes to the outbox, and when. */
class Outbox extends Driver(EventOutbox) {
  readonly written: RecordedEvent[] = [];

  async write(records: readonly RecordedEvent[]): Promise<void> {
    log.push("outbox");
    this.written.push(...records);
  }
}

describe("ActionPipeline governance additions", () => {
  it("parks a call at the approval step, before idempotency, and runs it with a granted approval", async () => {
    const approvals = new Approvals();
    const { pipeline } = setup([[ApprovalGate, approvals]]);
    await expect(
      pipeline.execute(
        CreateOrderAction,
        { quantity: 1 },
        { actor: customer, idempotencyKey: "k-approval" },
      ),
    ).rejects.toMatchObject({ code: "approval_required", approvalId: "apr_parked" });
    expect(log.indexOf("approval")).toBeGreaterThan(log.indexOf("flag"));
    expect(log).not.toContain("handle");
    await expect(
      pipeline.execute(
        CreateOrderAction,
        { quantity: 1 },
        { actor: customer, idempotencyKey: "k-approval", approvalId: "apr_granted" },
      ),
    ).resolves.toMatchObject({ orderId: "ord_1" });
    expect(approvals.seen.at(-1)).toEqual(["order.create", { quantity: 1 }, "apr_granted"]);
  });

  it("never parks a query", async () => {
    const approvals = new Approvals();
    const { pipeline } = setup([[ApprovalGate, approvals]]);
    await pipeline.execute(GetOrderQuery, { orderId: "ord_1" }, { actor: customer });
    expect(approvals.seen).toEqual([]);
  });

  it("refuses a structural write in live, runs it in a sandbox, and needs a guard", async () => {
    const environments = new Environments();
    const { pipeline } = setup([
      [LiveConfigurationGuard, environments],
      [PublishShellAction, new PublishShellAction()],
    ]);
    await expect(
      pipeline.execute(PublishShellAction, {}, { actor: customer }),
    ).rejects.toBeInstanceOf(LiveReadOnlyError);
    expect(log.slice(0, 2)).toEqual(["tenancy", "live-guard"]);
    environments.live = false;
    await expect(pipeline.execute(PublishShellAction, {}, { actor: customer })).resolves.toBe(
      "published",
    );
    const { pipeline: unguarded } = setup([[PublishShellAction, new PublishShellAction()]]);
    await expect(unguarded.execute(PublishShellAction, {}, { actor: customer })).rejects.toThrow(
      /LiveConfigurationGuard is not bound/,
    );
  });

  it("writes the meter's usage event in the unit of work, with the registered effects on the descriptor", async () => {
    const outbox = new Outbox();
    const { pipeline, access } = setup([
      [EventOutbox, outbox],
      [RefundAction, new RefundAction()],
      [SignInAction, new SignInAction()],
    ]);
    await pipeline.execute(
      RefundAction,
      { amount: { minor: 2500, currency: "SAR" } },
      { actor: customer, scope: SCOPE },
    );
    expect(log.slice(log.indexOf("begin"))).toEqual(["begin", "handle", "outbox", "commit"]);
    const [usage] = outbox.written;
    expect(usage?.event).toBeInstanceOf(UsageRecorded);
    expect(usage?.event).toMatchObject({
      meter: "payments.refunded",
      kind: "sum",
      value: 2500,
      key: "payments.payment.refund@1",
      scopeId: SCOPE.id,
    });
    expect(usage?.meta).toMatchObject({ occurredAt: NOW, scopeId: "ten_1", actor: customer });
    expect(usage?.meta.id.startsWith("evt_")).toBe(true);
    expect(access.calls.at(-1)?.effects).toEqual([Effect.Financial, Effect.Irreversible]);
    await pipeline.execute(SignInAction, { deviceId: "dev_9" }, { actor: customer });
    expect(outbox.written.at(-1)?.event).toMatchObject({
      kind: "unique",
      value: 1,
      subject: "dev_9",
    });
    await expect(pipeline.execute(SignInAction, {}, { actor: customer })).rejects.toBeInstanceOf(
      InputInvalidError,
    );
  });

  it("reads a capped call's amount from its declared field", async () => {
    const { pipeline } = setup([
      [OfflineCapStore, new MemoryOfflineCapStoreDriver()],
      [DeviceSequenceStore, new MemoryDeviceSequenceStoreDriver()],
      [TopUpAction, new TopUpAction()],
    ]);
    await pipeline.execute(
      TopUpAction,
      { total: 800 },
      { actor: customer, device: { deviceId: "dev_1", sequence: 1 } },
    );
    await expect(
      pipeline.execute(
        TopUpAction,
        { total: 300 },
        { actor: customer, device: { deviceId: "dev_1", sequence: 2 } },
      ),
    ).rejects.toBeInstanceOf(OfflineCapReachedError);
  });
});

/** Logs the reservation around the commit, and refuses once `full`. */
class Seats extends Driver(LimitReservation) {
  readonly keys: string[] = [];

  full = false;

  async reserve<T>(call: CallDescriptor, _input: unknown, commit: () => Promise<T>): Promise<T> {
    log.push("reserve");
    this.keys.push(call.key);
    if (this.full) throw RateLimitedError.create();
    const output = await commit();
    log.push("release");
    return output;
  }
}

/** An audit trail that logs when it writes. */
class LoggingTrail extends Driver(AuditTrail) {
  readonly entries: AuditEntry[] = [];

  async record(entry: AuditEntry): Promise<void> {
    log.push(`audit:${entry.outcome}`);
    this.entries.push(entry);
  }
}

class BulkNotifyAction extends Action({
  key: "message.notify_all",
  actors: [ActorKind.User],
  effects: [Effect.Bulk, Effect.ExternalCommunication],
}) {
  async handle(): Promise<string> {
    log.push("handle");
    return "sent";
  }
}

/** An action that always needs an approval gate. */
class ApprovedRefundAction extends Action({
  key: "order.refund",
  actors: [ActorKind.User],
  approval: true,
}) {
  async handle(): Promise<string> {
    log.push("handle");
    return "refunded";
  }
}

/** An action that needs two factors. */
class RotateKeyAction extends Action({
  key: "api_key.rotate",
  actors: [ActorKind.User],
  stepUp: AssuranceLevel.Aal2,
}) {
  async handle(_input: object, ctx: ActionContext): Promise<CallAssurance | undefined> {
    log.push("handle");
    return ctx.assurance;
  }
}

/** Passes when the call's level is at least the required one; records what it saw. */
class LevelStepUp extends Driver(StepUpCheck) {
  readonly seen: [string, CallAssurance | undefined, AssuranceLevel][] = [];

  async require(
    call: CallDescriptor,
    assurance: CallAssurance | undefined,
    level: AssuranceLevel,
  ): Promise<void> {
    log.push("step_up");
    this.seen.push([call.key, assurance, level]);
    const order = Enum.values(AssuranceLevel);
    if (assurance?.level === undefined || order.indexOf(assurance.level) < order.indexOf(level))
      throw StepUpNeededError.create();
  }
}

/** The step-up refusal a driver raises. */
class StepUpNeededError extends Refusal({ kind: ErrorKind.Unauthenticated }) {}

describe("ActionPipeline step-up (STA-814)", () => {
  const strong: CallAssurance = {
    amr: ["pwd", "otp"],
    authTime: new Date("2026-10-24T09:59:00.000Z"),
    level: AssuranceLevel.Aal2,
  };

  it("checks the step-up right after the permission and hands the assurance to the context", async () => {
    const stepUp = new LevelStepUp();
    const { pipeline } = setup([
      [StepUpCheck, stepUp],
      [RotateKeyAction, new RotateKeyAction()],
    ]);
    const output = await pipeline.execute(
      RotateKeyAction,
      {},
      { actor: customer, assurance: strong },
    );
    expect(output).toEqual(strong);
    expect(log.indexOf("step_up")).toBe(log.indexOf("permission") + 1);
    expect(stepUp.seen).toEqual([["api_key.rotate", strong, "aal2"]]);
  });

  it("refuses a weaker or missing assurance before handle", async () => {
    const { pipeline } = setup([
      [StepUpCheck, new LevelStepUp()],
      [RotateKeyAction, new RotateKeyAction()],
    ]);
    await expect(
      pipeline.execute(
        RotateKeyAction,
        {},
        { actor: customer, assurance: { ...strong, level: "aal1" } },
      ),
    ).rejects.toBeInstanceOf(StepUpNeededError);
    await expect(pipeline.execute(RotateKeyAction, {}, { actor: customer })).rejects.toBeInstanceOf(
      StepUpNeededError,
    );
    expect(log).not.toContain("handle");
  });

  it("fails closed when an action declares stepUp and no StepUpCheck is bound, and skips actions without it", async () => {
    const { pipeline } = setup([[RotateKeyAction, new RotateKeyAction()]]);
    await expect(
      pipeline.execute(RotateKeyAction, {}, { actor: customer, assurance: strong }),
    ).rejects.toThrow(/StepUpCheck is not bound/);
    const inspected = await pipeline.execute(
      InspectAction,
      {},
      { actor: customer, assurance: strong },
    );
    expect(inspected).toBeDefined();
  });

  it("rejects a stepUp that is not an AssuranceLevel", () => {
    expect(() =>
      Action({ key: "api_key.rotate", actors: [ActorKind.User], stepUp: "aal9" as AssuranceLevel }),
    ).toThrow(RangeError);
    expect(() =>
      Action({ key: "order.refund", actors: [ActorKind.User], approval: "yes" as never }),
    ).toThrow(TypeError);
  });
});

describe("ActionPipeline remainder (STA-765)", () => {
  it("runs no approval step when no ApprovalGate is bound, unless the action declares approval (STA-813)", async () => {
    const bare = new ActionPipeline(
      resolverOf([
        [AccessControl, new RecordingAccess()],
        [InspectAction, new InspectAction()],
        [ApprovedRefundAction, new ApprovedRefundAction()],
        [GetOrderQuery, new GetOrderQuery()],
        [TracingInterceptor, new TracingInterceptor()],
      ]),
    );
    await expect(bare.execute(InspectAction, {}, { actor: customer })).resolves.toBeDefined();
    await expect(bare.execute(ApprovedRefundAction, {}, { actor: customer })).rejects.toThrow(
      /ApprovalGate is not bound: order\.refund declares approval: true/,
    );
    await expect(
      bare.execute(GetOrderQuery, { orderId: "ord_1" }, { actor: customer }),
    ).resolves.toBeDefined();
  });

  it("asks a bound gate about an action that declares approval", async () => {
    const approvals = new Approvals();
    const { pipeline } = setup([
      [ApprovalGate, approvals],
      [ApprovedRefundAction, new ApprovedRefundAction()],
    ]);
    await expect(
      pipeline.execute(ApprovedRefundAction, {}, { actor: customer }),
    ).rejects.toMatchObject({ code: "approval_required" });
    expect(approvals.seen.at(-1)?.[0]).toBe("order.refund");
  });

  it("reserves the limit around the unit of work, and runs no handle when it is full", async () => {
    const seats = new Seats();
    const { pipeline } = setup([[LimitReservation, seats]]);
    await pipeline.execute(
      CreateOrderAction,
      { quantity: 1 },
      { actor: customer, idempotencyKey: "k-seat" },
    );
    expect(log.slice(log.indexOf("reserve"), log.indexOf("release") + 1)).toEqual([
      "reserve",
      "begin",
      "handle",
      "commit",
      "release",
    ]);
    expect(seats.keys).toEqual(["order.create"]);
    seats.full = true;
    log = [];
    await expect(
      pipeline.execute(
        CreateOrderAction,
        { quantity: 1 },
        { actor: customer, idempotencyKey: "k-full" },
      ),
    ).rejects.toBeInstanceOf(RateLimitedError);
    expect(log).not.toContain("handle");
  });

  it("writes a successful call's audit entry inside the unit of work, a refusal's after the rollback", async () => {
    const trail = new LoggingTrail();
    const { pipeline, shop } = setup([[AuditTrail, trail]]);
    await pipeline.execute(
      CreateOrderAction,
      { quantity: 2 },
      { actor: customer, idempotencyKey: "k-audit" },
    );
    expect(log.slice(log.indexOf("begin"), log.indexOf("commit") + 1)).toEqual([
      "begin",
      "handle",
      "audit:ok",
      "commit",
    ]);
    await pipeline.execute(
      CreateOrderAction,
      { quantity: 2 },
      { actor: customer, idempotencyKey: "k-audit" },
    );
    expect(trail.entries.map(({ outcome }) => outcome)).toEqual(["ok", "ok"]);
    shop.open = false;
    log = [];
    await expect(
      pipeline.execute(
        CreateOrderAction,
        { quantity: 1 },
        { actor: customer, idempotencyKey: "k-no" },
      ),
    ).rejects.toBeInstanceOf(OrdersPausedError);
    expect(log.at(-1)).toBe("audit:refused");
  });

  it("puts the written effect tags on the descriptor when gen registered none", async () => {
    const { pipeline, access } = setup([[BulkNotifyAction, new BulkNotifyAction()]]);
    await pipeline.execute(BulkNotifyAction, {}, { actor: customer });
    expect(access.calls.at(-1)?.effects).toEqual([Effect.Bulk, Effect.ExternalCommunication]);
  });
});

describe("ActionPipeline.propose (STA-784)", () => {
  it("checks the call up to validation, meters it, and returns a draft with no effects", async () => {
    const outbox = new Outbox();
    const approvals = new Approvals();
    const { pipeline } = setup([
      [EventOutbox, outbox],
      [ApprovalGate, approvals],
    ]);
    const draft = await pipeline.propose(
      CreateOrderAction,
      { quantity: 4 },
      { actor: agent, scope: SCOPE },
    );
    expect(draft).toMatchObject({ key: "order.create", input: { quantity: 4 }, proposedAt: NOW });
    expect(log).toEqual(["tenancy", "permission", "precondition", "entitlement", "flag", "outbox"]);
    expect(approvals.seen).toEqual([]);
    expect(outbox.written[0]?.event).toMatchObject({
      meter: "actions.proposals",
      kind: "count",
      value: 1,
      key: "order.create",
      callId: draft.callId,
      scopeId: SCOPE.id,
    });
  });

  it("refuses what a step refuses, and never proposes a query", async () => {
    const { pipeline, shop } = setup([[EventOutbox, new Outbox()]]);
    shop.open = false;
    await expect(
      pipeline.propose(CreateOrderAction, { quantity: 1 }, { actor: customer }),
    ).rejects.toBeInstanceOf(OrdersPausedError);
    await expect(
      pipeline.propose(GetOrderQuery as never, { orderId: "ord_1" } as never, { actor: customer }),
    ).rejects.toThrow(TypeError);
  });
});

/** A query that answers with the call's sandbox flag and network client. */
class WhereQuery extends Query({
  key: "call.where",
  actors: [ActorKind.User],
}) {
  async handle(
    _input: object,
    ctx: QueryContext,
  ): Promise<Pick<QueryContext, "sandbox" | "client">> {
    return {
      ...(ctx.sandbox === undefined ? {} : { sandbox: ctx.sandbox }),
      ...(ctx.client === undefined ? {} : { client: ctx.client }),
    };
  }
}

describe("ActionPipeline sandbox and client (STA-1248)", () => {
  const client = { address: "203.0.113.7", userAgent: "kettle/1.0" };

  it("hands the sandbox flag to the descriptor and the context, and the client to the context only", async () => {
    const { pipeline, access } = setup([[WhereQuery, new WhereQuery()]]);
    const output = await pipeline.execute(
      WhereQuery,
      {},
      { actor: customer, sandbox: true, client },
    );
    expect(output).toEqual({ sandbox: true, client });
    expect(access.calls.at(-1)?.sandbox).toBe(true);
    expect(access.calls.at(-1)).not.toHaveProperty("client");
  });

  it("leaves both absent for a live call with no client", async () => {
    const { pipeline, access } = setup([[WhereQuery, new WhereQuery()]]);
    const output = await pipeline.execute(WhereQuery, {}, { actor: customer, sandbox: false });
    expect(output).toEqual({ sandbox: undefined, client: undefined });
    expect(access.calls.at(-1)).not.toHaveProperty("sandbox");
  });
});

/** A query that answers with the call's request origin. */
class OriginQuery extends Query({
  key: "call.origin",
  actors: [ActorKind.User, ActorKind.Agent],
}) {
  async handle(_input: object, ctx: QueryContext): Promise<{ origin?: CallOrigin }> {
    return ctx.origin === undefined ? {} : { origin: ctx.origin };
  }
}

describe("ActionPipeline request origin (ADR 0456)", () => {
  it("hands the origin to the descriptor, the audit entry and the context", async () => {
    const { pipeline, access, trail } = setup([[OriginQuery, new OriginQuery()]]);
    const origin: CallOrigin = { kind: CallOriginKind.Agent, id: "agt_1" };
    expect(await pipeline.execute(OriginQuery, {}, { actor: agent, origin })).toEqual({ origin });
    expect(access.calls.at(-1)?.origin).toEqual(origin);
    await pipeline.execute(
      CreateOrderAction,
      { quantity: 1 },
      {
        actor: customer,
        idempotencyKey: "k-origin",
        origin: { kind: CallOriginKind.Storefront, id: "sfr_1" },
      },
    );
    expect(trail.entries.at(-1)?.call.origin).toEqual({ kind: "storefront", id: "sfr_1" });
  });

  it("leaves it absent for an internal call", async () => {
    const { pipeline, access } = setup([[OriginQuery, new OriginQuery()]]);
    expect(await pipeline.execute(OriginQuery, {}, { actor: customer })).toEqual({});
    expect(access.calls.at(-1)).not.toHaveProperty("origin");
  });
});

/** An integration event that no model owns. */
class StockNearExpiry extends IntegrationEvent({ name: "stock.near_expiry" }) {
  sku!: string;
}

/** A domain event, which only a model records. */
class StockCounted extends DomainEvent {
  sku!: string;
}

registerSchemas([
  [StockNearExpiry, z.object({ sku: z.string() })],
  [StockCounted, z.object({ sku: z.string() })],
]);

/** Publishes the event its input names, then refuses when told to. */
class AlertAction extends Action({
  key: "stock.alert",
  actors: [ActorKind.User],
}) {
  async handle(input: { domain?: boolean; refuse?: boolean }, ctx: ActionContext): Promise<void> {
    log.push("handle");
    await ctx.publish(
      input.domain === true
        ? StockCounted.create({ sku: "sku_1" })
        : StockNearExpiry.create({ sku: "sku_1" }),
    );
    if (input.refuse === true) throw OrdersPausedError.create();
  }
}

describe("ActionPipeline ctx.publish (ADR 0456)", () => {
  it("writes the event through the outbox inside the unit of work, with the call's metadata", async () => {
    const outbox = new Outbox();
    const { pipeline } = setup([
      [EventOutbox, outbox],
      [AlertAction, new AlertAction()],
    ]);
    await pipeline.execute(AlertAction, {}, { actor: customer, callId: "call_alert" });
    expect(log.slice(log.indexOf("begin"))).toEqual(["begin", "handle", "outbox", "commit"]);
    expect(outbox.written[0]?.event).toBeInstanceOf(StockNearExpiry);
    expect(outbox.written[0]?.meta).toMatchObject({
      occurredAt: NOW,
      scopeId: "ten_1",
      actor: customer,
      correlationId: "call_alert",
    });
  });

  it("rolls back with a refused call, refuses a domain event and needs an outbox", async () => {
    const outbox = new Outbox();
    const { pipeline } = setup([
      [EventOutbox, outbox],
      [AlertAction, new AlertAction()],
    ]);
    await expect(
      pipeline.execute(AlertAction, { refuse: true }, { actor: customer }),
    ).rejects.toBeInstanceOf(OrdersPausedError);
    expect(log.at(-1)).toBe("rollback");
    await expect(
      pipeline.execute(AlertAction, { domain: true }, { actor: customer }),
    ).rejects.toThrow(/not an IntegrationEvent/);
    const bare = setup([[AlertAction, new AlertAction()]]);
    await expect(bare.pipeline.execute(AlertAction, {}, { actor: customer })).rejects.toThrow(
      /EventOutbox is not bound/,
    );
  });
});

/** A cache over a map: records each key with the namespace (the storage's current scope id) it was used in. */
class MapCache extends Driver(Cache) {
  readonly entries = new Map<string, unknown>();

  readonly used: string[] = [];

  private readonly storage: AsyncContextStorageDriver;

  constructor(storage: AsyncContextStorageDriver) {
    super();
    this.storage = storage;
  }

  async get<T>(key: CacheKey): Promise<T | undefined> {
    return this.entries.get(this.at(key)) as T | undefined;
  }

  async put<T>(key: CacheKey, value: T): Promise<void> {
    this.entries.set(this.at(key), value);
  }

  async remember<T>(key: CacheKey, _ttl: Duration, load: () => T | Promise<T>): Promise<T> {
    const at = this.at(key);
    if (this.entries.has(at)) return this.entries.get(at) as T;
    const value = await load();
    this.entries.set(at, value);
    return value;
  }

  async forget(key: CacheKey): Promise<void> {
    for (const known of this.entries.keys())
      if (known === this.at(key) || known.startsWith(`${this.at(key)}:`))
        this.entries.delete(known);
  }

  async forgetTag(): Promise<void> {}

  private at(key: CacheKey): string {
    const scope = (this.storage.current() as { scope?: ScopeRef } | undefined)?.scope;
    const at = `${scope?.id ?? ""}/${key}`;
    this.used.push(at);
    return at;
  }
}

/** A cached query that answers how often it ran and the scope its handle saw. */
class CountQuery extends Query({
  key: "order.count",
  actors: [ActorKind.User, ActorKind.Agent],
  interceptors: [TracingInterceptor],
  cache: { ttl: "5m" },
}) {
  runs = 0;

  async handle(
    _input: { range: string },
    ctx: QueryContext,
  ): Promise<{ runs: number; scope?: string }> {
    log.push("handle");
    this.runs += 1;
    return { runs: this.runs, ...(ctx.scope === undefined ? {} : { scope: ctx.scope.id }) };
  }
}

/** The same query shared per scope node. */
class ScopeCountQuery extends Query({
  key: "order.scope_count",
  actors: [ActorKind.User, ActorKind.Agent],
  cache: { ttl: "5m", per: CacheScope.Scope },
}) {
  runs = 0;

  async handle(): Promise<number> {
    this.runs += 1;
    return this.runs;
  }
}

/** The same query shared per site. */
class SiteCountQuery extends Query({
  key: "order.site_count",
  actors: [ActorKind.User, ActorKind.Agent],
  cache: { ttl: "5m", per: CacheScope.Site },
}) {
  runs = 0;

  async handle(): Promise<number> {
    this.runs += 1;
    return this.runs;
  }
}

/** A pipeline with a map cache, its storage and the three cached queries. */
function cached() {
  const storage = new AsyncContextStorageDriver();
  const cache = new MapCache(storage);
  const count = new CountQuery();
  const scoped = new ScopeCountQuery();
  const site = new SiteCountQuery();
  const { pipeline } = setup([
    [ContextStorage, storage],
    [Cache, cache],
    [CountQuery, count],
    [ScopeCountQuery, scoped],
    [SiteCountQuery, site],
  ]);
  return { pipeline, cache, count, scoped, site };
}

describe("ActionPipeline query cache (STA-1445)", () => {
  it("answers a repeat from the entry inside the interceptors, so only handle is skipped", async () => {
    const { pipeline, count } = cached();
    const first = await pipeline.execute(
      CountQuery,
      { range: "7d" },
      { actor: customer, scope: SCOPE },
    );
    log = [];
    const second = await pipeline.execute(
      CountQuery,
      { range: "7d" },
      { actor: customer, scope: SCOPE },
    );
    expect(first).toEqual({ runs: 1, scope: SCOPE.id });
    expect(second).toEqual(first);
    expect(count.runs).toBe(1);
    expect(log).toContain("interceptor:before");
    expect(log).not.toContain("handle");
  });

  it("keys per principal by default: another caller, input, locale or sandbox runs handle again", async () => {
    const { pipeline, count } = cached();
    await pipeline.execute(CountQuery, { range: "7d" }, { actor: customer });
    await pipeline.execute(CountQuery, { range: "7d" }, { actor: agent });
    await pipeline.execute(CountQuery, { range: "30d" }, { actor: customer });
    await pipeline.execute(CountQuery, { range: "7d" }, { actor: customer, locale: "ar-SA" });
    await pipeline.execute(CountQuery, { range: "7d" }, { actor: customer, sandbox: true });
    await pipeline.execute(CountQuery, { range: "7d" }, { actor: customer });
    expect(count.runs).toBe(5);
  });

  it("shares a Scope entry between callers of one scope node, never across nodes or tenants", async () => {
    const { pipeline, scoped } = cached();
    const other: ScopeRef = { id: "scp_01j9z3k4m5n6p7q8r9s0t1v2w2", path: "platform.acme.east" };
    expect(await pipeline.execute(ScopeCountQuery, {}, { actor: customer, scope: SCOPE })).toBe(1);
    expect(await pipeline.execute(ScopeCountQuery, {}, { actor: agent, scope: SCOPE })).toBe(1);
    expect(await pipeline.execute(ScopeCountQuery, {}, { actor: agent, scope: other })).toBe(2);
    const stranger: Actor = { ...agent, scopeId: "ten_2" };
    expect(await pipeline.execute(ScopeCountQuery, {}, { actor: stranger, scope: SCOPE })).toBe(3);
    expect(scoped.runs).toBe(3);
  });

  it("shares a Site entry between callers of one origin", async () => {
    const { pipeline, site } = cached();
    const storefront: CallOrigin = { kind: CallOriginKind.Storefront, id: "sfr_1" };
    expect(
      await pipeline.execute(SiteCountQuery, {}, { actor: customer, origin: storefront }),
    ).toBe(1);
    expect(await pipeline.execute(SiteCountQuery, {}, { actor: agent, origin: storefront })).toBe(
      1,
    );
    expect(
      await pipeline.execute(
        SiteCountQuery,
        {},
        { actor: agent, origin: { kind: CallOriginKind.Storefront, id: "sfr_2" } },
      ),
    ).toBe(2);
    expect(site.runs).toBe(2);
  });

  it("keeps the entry in the shared namespace under the tenant's key, while handle sees the call's scope", async () => {
    const { pipeline, cache } = cached();
    const output = await pipeline.execute(
      CountQuery,
      { range: "7d" },
      { actor: customer, scope: SCOPE },
    );
    expect(output).toEqual({ runs: 1, scope: SCOPE.id });
    expect([...cache.entries.keys()]).toEqual([
      expect.stringMatching(/^\/CountQuery:ten_1:principal:usr_1:[0-9a-f]{64}$/),
    ]);
  });

  it("does not run without a bound Cache", async () => {
    const count = new CountQuery();
    const { pipeline } = setup([[CountQuery, count]]);
    await pipeline.execute(CountQuery, { range: "7d" }, { actor: customer });
    await pipeline.execute(CountQuery, { range: "7d" }, { actor: customer });
    expect(count.runs).toBe(2);
  });
});

/** A query that reads the call's consent twice. */
class ConsentQuery extends Query({
  key: "call.consent",
  actors: [ActorKind.User],
}) {
  async handle(_input: object, ctx: QueryContext): Promise<CallConsent> {
    await ctx.consent();
    return ctx.consent();
  }
}

/** A consent check that grants analytics to the snapshot `good` and records what it saw. */
class RecordingConsentCheck extends Driver(ConsentCheck) {
  readonly seen: (readonly [string, string])[] = [];

  async check(snapshot: string, call: CallDescriptor): Promise<CallConsent> {
    this.seen.push([snapshot, call.key]);
    if (snapshot !== "good")
      return { verified: false, refusal: ConsentRefusal.BadSignature, granted: [] };
    return {
      verified: true,
      snapshotId: "csn_1",
      subject: "anon_1",
      granted: ["necessary", "analytics"],
      expiresAt: new Date("2026-10-25T10:00:00.000Z"),
    };
  }
}

describe("ActionPipeline consent (ADR 0472)", () => {
  it("reads as refused (missing) when the call carries no snapshot", async () => {
    const check = new RecordingConsentCheck();
    const { pipeline } = setup([
      [ConsentQuery, new ConsentQuery()],
      [ConsentCheck, check],
    ]);
    const consent = await pipeline.execute(ConsentQuery, {}, { actor: customer });
    expect(consent).toEqual({ verified: false, refusal: ConsentRefusal.Missing, granted: [] });
    expect(check.seen).toEqual([]);
  });

  it("reads as refused (unchecked) when no ConsentCheck is bound", async () => {
    const { pipeline } = setup([[ConsentQuery, new ConsentQuery()]]);
    const consent = await pipeline.execute(
      ConsentQuery,
      {},
      { actor: customer, consentSnapshot: "good" },
    );
    expect(consent).toEqual({ verified: false, refusal: ConsentRefusal.Unchecked, granted: [] });
  });

  it("verifies the snapshot once per call and hands over the check's answer", async () => {
    const check = new RecordingConsentCheck();
    const { pipeline } = setup([
      [ConsentQuery, new ConsentQuery()],
      [ConsentCheck, check],
    ]);
    const consent = await pipeline.execute(
      ConsentQuery,
      {},
      { actor: customer, consentSnapshot: "good" },
    );
    expect(consent).toMatchObject({ verified: true, granted: ["necessary", "analytics"] });
    expect(check.seen).toEqual([["good", "call.consent"]]);
  });

  it("never refuses the call over a bad snapshot", async () => {
    const { pipeline } = setup([
      [ConsentQuery, new ConsentQuery()],
      [ConsentCheck, new RecordingConsentCheck()],
    ]);
    await expect(
      pipeline.execute(ConsentQuery, {}, { actor: customer, consentSnapshot: "forged" }),
    ).resolves.toEqual({ verified: false, refusal: ConsentRefusal.BadSignature, granted: [] });
  });
});

/** One span the recording tracer saw: its name, start attributes, attributes set later and the failure. */
interface SeenSpan {
  readonly name: string;
  readonly attributes: TraceAttributes;
  readonly set: Record<string, string | number | boolean>;
  failed: unknown;
}

/** A tracer that records every span and runs the work unchanged. */
class RecordingTracer extends Driver(Tracer) {
  readonly spans: SeenSpan[] = [];

  async span<T>(
    name: string,
    attributes: TraceAttributes,
    work: (span: TraceSpan) => Promise<T>,
  ): Promise<T> {
    const seen: SeenSpan = { name, attributes, set: {}, failed: undefined };
    this.spans.push(seen);
    return work({
      set: (more) => Object.assign(seen.set, more),
      fail: (error) => {
        seen.failed = error;
      },
    });
  }
}

/** A query whose handle throws a plain error (a bug, not a refusal). */
class BrokenQuery extends Query({
  key: "order.broken",
  actors: [ActorKind.User],
}) {
  async handle(): Promise<never> {
    throw new Error("boom");
  }
}

describe("ActionPipeline tracing (ADR 0147, STA-1513)", () => {
  it("runs an action in one span with the call's ids and an ok outcome, no input values", async () => {
    const tracer = new RecordingTracer();
    const { pipeline } = setup([[Tracer, tracer]]);
    await pipeline.execute(
      CreateOrderAction,
      { quantity: 7 },
      { actor: customer, scope: SCOPE, idempotencyKey: "k1", callId: "call_1" },
    );
    expect(tracer.spans).toHaveLength(1);
    const [span] = tracer.spans;
    expect(span?.name).toBe("action order.create");
    expect(span?.attributes).toEqual({
      action: "order.create",
      correlationId: "call_1",
      actorType: ActorKind.User,
      actorId: "usr_1",
      scopeId: SCOPE.id,
    });
    expect(span?.set).toMatchObject({ outcome: "ok", latencyMs: expect.any(Number) });
    expect(span?.failed).toBeUndefined();
    const values = Object.values({ ...span?.attributes, ...span?.set });
    expect(values).not.toContain(7);
    expect(values).not.toContain("k1");
  });

  it("marks a refusal as refused with its code and does not fail the span", async () => {
    const tracer = new RecordingTracer();
    const { pipeline, shop } = setup([[Tracer, tracer]]);
    shop.failNext = true;
    await expect(
      pipeline.execute(
        CreateOrderAction,
        { quantity: 1 },
        { actor: customer, idempotencyKey: "k" },
      ),
    ).rejects.toBeInstanceOf(OutOfStockError);
    expect(tracer.spans[0]?.set).toMatchObject({ outcome: "refused", code: "out_of_stock" });
    expect(tracer.spans[0]?.failed).toBeUndefined();
  });

  it("fails the span of a query whose handle throws a plain error and passes the error on", async () => {
    const tracer = new RecordingTracer();
    const { pipeline } = setup([
      [Tracer, tracer],
      [BrokenQuery, new BrokenQuery()],
    ]);
    await expect(pipeline.execute(BrokenQuery, {}, { actor: customer })).rejects.toThrow("boom");
    expect(tracer.spans[0]?.name).toBe("query order.broken");
    expect(tracer.spans[0]?.set).toMatchObject({ outcome: "error" });
    expect(tracer.spans[0]?.failed).toBeInstanceOf(Error);
  });

  it("traces a proposal as propose <key>", async () => {
    const tracer = new RecordingTracer();
    const outbox = new Outbox();
    const { pipeline } = setup([
      [Tracer, tracer],
      [EventOutbox, outbox],
    ]);
    await pipeline.propose(CreateOrderAction, { quantity: 1 }, { actor: customer });
    expect(tracer.spans.map((span) => span.name)).toEqual(["propose order.create"]);
  });

  it("runs the call as before when no Tracer is bound", async () => {
    const { pipeline } = setup();
    await expect(
      pipeline.execute(GetOrderQuery, { orderId: "ord_1" }, { actor: customer }),
    ).resolves.toEqual({ orderId: "ord_1", afterCommit: false });
  });
});
