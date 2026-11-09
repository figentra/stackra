/**
 * Stackra file contract:
 * Purpose: unit tests of `ActionPipeline`: the fixed order of the steps; the actor check and fail-closed permission;
 *          input validation from a registered schema; idempotency (required, replayed, reused, derived, released on
 *          failure, a shorter window, a @ShownOnce output field never kept); the area and action rate limits (the area bucket plan-sized by `RateLimitBudget`, keyed by (app, scope), a refusal
 *          with its back-off details and a `rate_limited` usage event, the default per-scope and per-hashed-address
 *          buckets of an action with no `rateLimit`); the unit of work with `afterCommit`; the audit entry; the call
 *          context (frozen clock, request facts, registered key, the call's scope, `RequestContext`); the workflow,
 *          signal and job capabilities (the dispatcher sees the scope); interceptors; a query's lighter path; and the
 *          offline additions: a revoked device's call refused before device order (STA-1684); a device's calls in
 *          sequence order (sequences are not contiguous; refusals settle; a resend replays or is refused; a call with no sequence is not ordered and reads `ctx.deviceId`), the offline
 *          cap by count and amount, the review of offline-computed documents, and a replica query's full fill and the
 *          changes since the cursor in its input; and the governance additions: the approval step before idempotency,
 *          the live-configuration guard of a structural action, the meter's usage event inside the unit of work, the
 *          cap's amount field, and the registered effect tags on the descriptor; and the remainder (STA-765): the
 *          approval step runs only with a gate bound unless the action declares `approval` (STA-813), the limit
 *          reservation wraps the unit of work, a successful call's audit entry is written inside it, and written effect
 *          tags reach the descriptor; and the step-up check with `ctx.assurance` (STA-814), asked of a user caller only (STA-340); and the sandbox flag on the
 *          descriptor and the context, and the network client on the context only (STA-1248); and the request origin
 *          on the descriptor, the audit entry and the context, and `ctx.publish` of an integration event without a
 *          model inside the unit of work (ADR 0456); and the query cache step (STA-1445): a hit inside the
 *          interceptors, keys per principal, scope node and site, the shared namespace with `handle` in the call's
 *          context, and no step without a bound `Cache`; and `ctx.consent()` (ADR 0472): refused without a snapshot or
 *          a bound `ConsentCheck`, the check's answer otherwise, verified once per call, never refusing the call; and
 *          the `Tracer` span per call (ADR 0147, STA-1513): its name, the attribute names with no input values, the
 *          outcome of a success, a refusal and a bug, a proposal's span, and no span without a bound tracer; and
 *          `reads: "replica"` (STA-1504): on the replica outside the window, on the primary after the caller's own
 *          committed write or a carried `lastWriteAt`, never for a refused write or another caller's write; and
 *          `analytics` (STA-1512): `action.called` in the unit of work and after a refusal, a declared AnalyticsEvent
 *          with only its fields, a query's event, nothing without granted consent, a skipped misfit, no replay event.
 *          Also `QueryBudget` around `handle` and the per-call `ctx.memo` (STA-1400). And the tree tenant: inside a
 *          bound `CallIsolation` a branch user's descriptor and context carry the tenant the isolation runs as as
 *          `scopeId`, and its approval binding and draft are written under it, with the branch on `branchScopeId`;
 *          a tenant-level user, a job and a system actor keep their tenant in both, a platform call has neither, and
 *          with no isolation bound the branch stays the `scopeId`. And `ctx.detach()`: each step after the call is a new
 *          writable isolation with the call's actor and scope that commits or rolls back alone, `RequestContext.detached()`
 *          answers only inside the detached run, another store's value stays readable, a branch user's steps run as the
 *          settled tenant, each `DETACHED_RUNS` wrapper is entered around a run and a lone step (never again for a step
 *          inside a run), and with no isolation bound a step runs as it is. And `ctx.attempt`: a queued job's attempt from
 *          the call options, none on a direct call.
 * Boundary: test only; every port is a stand-in driver in a map resolver, so each step is observed directly; the
 *           offline stores are the memory drivers.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0138 (as amended); ADR 0136 (decisions 1 to 3 and 5); ADR 0305
 *                     (rule 24); ADR 0217 (decision 2); ADR 0327 (decision 6); ADR 0338 (decisions 1, 3 and 5); ADR
 *                     0337 (decisions 4 and 5); ADR 0456 (decisions 1 and 2).
 */
import { AsyncLocalStorage } from "node:async_hooks";

import { Cache } from "@stackra/cache/contracts";
import type { CacheKey } from "@stackra/cache";
import { type AnyClass, Driver } from "@stackra/container";
import {
  type Actor,
  ActorKind,
  type Email,
  ApprovalSettingsSource,
  AssuranceLevel,
  Clock,
  Duration,
  Enum,
  IdempotencyRetentionSource,
  IdentityResolver,
  Logger,
  MeterKind,
  Realm,
  type PublicId,
  RateLimitCapSource,
  type RateLimitCaps,
  type ScopeRef,
  type TraceAttributes,
  type TraceCarrier,
  type TraceSpan,
  Tracer,
  type VerifiedPrincipal,
} from "@stackra/contracts";
import {
  ErrorKind,
  ForbiddenError,
  IdempotencyKeyInProgressError,
  IdempotencyKeyReusedError,
  isRefusal,
  LiveReadOnlyError,
  RateLimitedError,
  Refusal,
} from "@stackra/errors";
import { AnalyticsEvent, DomainEvent, IntegrationEvent } from "@stackra/events";
import type { RecordedEvent } from "@stackra/events/contracts";
import { EventOutbox } from "@stackra/events/contracts";
import { describe, expect, it, onTestFinished } from "@stackra/testing";
import { vi } from "vitest";
import { registerSchemas, Schema, ShownOnce } from "@stackra/validation";
import { z } from "zod";

import { RateLimitConfig } from "#config/rate-limit.config";
import {
  AccessControl,
  ActorStatusCheck,
  ApprovalBindingStore,
  ApprovalGate,
  AuditTrail,
  CallIsolation,
  ConsentCheck,
  ContextStorage,
  DeviceSequenceStore,
  DeviceStatusReader,
  EntitlementCheck,
  FlagCheck,
  IdempotencyStore,
  JobDispatcher,
  LimitReservation,
  LiveConfigurationGuard,
  OfflineCapStore,
  QueryBudget,
  RateLimitBudget,
  RateLimitStore,
  ReplicaLog,
  ReplicaReads,
  ReviewItemSink,
  StepUpCheck,
  TenancyCheck,
  UnitOfWork,
  WorkflowRunner,
} from "#contracts/index";
import type {
  ApprovalBinding,
  ApprovalDraft,
  ApprovalRecord,
  ApprovalRequirement,
  AuditEntry,
  CallAssurance,
  CallConsent,
  CallDescriptor,
  CallOrigin,
  RateLimitBucket,
} from "#contracts/index";
import { ConsentRefusal } from "#contracts/enums/consent-refusal.enum";
import { CallOriginKind } from "#contracts/enums/call-origin-kind.enum";
import { Action } from "#core/bases/action.base";
import { Interceptor } from "#core/bases/interceptor.base";
import { Precondition } from "#core/bases/precondition.base";
import { Query } from "#core/bases/query.base";
import { CacheScope } from "#core/enums/cache-scope.enum";
import { MemoryDeviceSequenceStoreDriver } from "#core/drivers/memory-device-sequence-store.driver";
import { MemoryDeviceStatusReaderDriver } from "#core/drivers/memory-device-status-reader.driver";
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
import { DeviceRevokedError } from "#core/errors/device-revoked.error";
import { DeviceSequenceOutOfOrderError } from "#core/errors/device-sequence-out-of-order.error";
import { IdempotencyKeyRequiredError } from "#core/errors/idempotency-key-required.error";
import { IdempotencyStoreNotTransactionalError } from "#core/errors/idempotency-store-not-transactional.error";
import { InputInvalidError } from "#core/errors/input-invalid.error";
import { OfflineCapReachedError } from "#core/errors/offline-cap-reached.error";
import { AnalyticsTracked } from "#core/events/analytics-tracked.event";
import { UsageRecorded } from "#core/events/usage-recorded.event";
import { registerActions } from "#core/functions/register-actions.function";
import { ActionPipeline } from "#core/services/action-pipeline.service";
import { ACTION_REGISTRY } from "#core/constants/action-registry.constant";
import { ReplicaFeed } from "#core/services/replica-feed.service";
import { RequestContext } from "#core/services/request-context.service";
import type { RuleEvaluation } from "#core/types/rule-evaluation.type";
import type { RuleEvaluator } from "#core/types/rule-evaluator.type";
import type { ActionContext } from "#core/types/action-context.type";
import type { DetachedCall } from "#core/types/detached-call.type";
import { DETACHED_RUNS } from "#contracts/constants/detached-runs.constant";
import type { DetachedRun } from "#contracts/types/detached-run.type";
import type { ApprovalSettingsReader } from "#core/types/approval-settings-reader.type";
import type { QueryContext } from "#core/types/query-context.type";
import type { ReplicaPage } from "#core/types/replica-page.type";
import type { Resolver } from "#core/types/resolver.type";
import { AsyncContextStorageDriver } from "#node/drivers/async-context-storage.driver";
import { ApprovalCondition } from "#core/bases/approval-condition.base";
import { fingerprintOf } from "#core/functions/fingerprint-of.function";
import { APPROVAL_PARK_FAILED } from "#core/constants/approval-park-failed.constant";
import { MemoryApprovalGateDriver } from "#testing/drivers/memory-approval-gate.driver";
import type { MemoryApprover } from "#testing/types/memory-approver.type";
import { MemoryActorStatusCheckDriver } from "#testing/drivers/memory-actor-status-check.driver";
import { MemoryApprovalBindingStoreDriver } from "#testing/drivers/memory-approval-binding-store.driver";

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

/** A Required write whose outcome a test chooses: it runs, refuses, crashes, or waits for `release`. */
class FlakyAction extends Action({
  key: "flaky.run",
  actors: [ActorKind.User],
  idempotency: Idempotency.Required,
}) {
  ran = 0;

  mode: "ok" | "refuse" | "retryable" | "crash" | "wait" = "ok";

  release: () => void = () => undefined;

  async handle(input: { quantity: number }): Promise<{ ran: number }> {
    this.ran += 1;
    if (this.mode === "refuse") throw OutOfStockError.create();
    if (this.mode === "retryable") throw RateLimitedError.create({ retryAfterMs: 1000 });
    if (this.mode === "crash") throw new TypeError("boom");
    if (this.mode === "wait")
      await new Promise<void>((resolve) => {
        this.release = resolve;
      });
    return { ran: this.ran + input.quantity };
  }
}

/** FlakyAction's behaviour on a Derived action, whose key a non-API-key caller never sends. */
class DerivedFlakyAction extends Action({
  key: "flaky.derived",
  actors: [ActorKind.User],
  idempotency: Idempotency.Derived,
}) {
  ran = 0;

  mode: "ok" | "refuse" = "ok";

  async handle(input: { quantity: number }): Promise<{ ran: number }> {
    this.ran += 1;
    if (this.mode === "refuse") throw OutOfStockError.create();
    return { ran: this.ran + input.quantity };
  }
}

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

/** A Derived write with no rate limit, so a test can count its effects. */
class IssueRefundAction extends Action({
  key: "refund.issue",
  actors: [ActorKind.User],
  idempotency: Idempotency.Derived,
}) {
  issued = 0;

  async handle(input: { paymentId: string }): Promise<{ count: number; paymentId: string }> {
    this.issued += 1;
    return { count: this.issued, paymentId: input.paymentId };
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

/** Hands out a secret: its output must never land in the idempotency store. */
class PickupSecretAction extends Action({
  key: "secret.pickup",
  actors: [ActorKind.User],
  idempotency: Idempotency.Never,
}) {
  picked = 0;

  async handle(): Promise<{ token: string }> {
    this.picked += 1;
    return { token: `token-${this.picked}` };
  }
}

/** A registered endpoint's output: the signing secret is shown once. */
class RegisterEndpointOutput extends Schema {
  @ShownOnce
  signingSecret!: string;

  endpointId!: string;
}

/** Registers a webhook endpoint once per key: a retry replays the endpoint without its secret. */
class RegisterEndpointAction extends Action({
  key: "endpoint.register",
  actors: [ActorKind.User],
  idempotency: Idempotency.Required,
  idempotencyTtl: Duration.minutes(10),
}) {
  registered = 0;

  async handle(): Promise<{ endpointId: string; signingSecret: string }> {
    this.registered += 1;
    return { endpointId: `whe_${this.registered}`, signingSecret: `whsec_${this.registered}` };
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
  const flaky = new FlakyAction();
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
    [FlakyAction, flaky],
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
    flaky,
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

  it("rolls back a refused call and keeps its refusal as the answer for the same key", async () => {
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
    // handle would succeed now, but the key already has its answer
    const again = await pipeline
      .execute(CreateOrderAction, { quantity: 1 }, { actor: customer, idempotencyKey: "k1" })
      .catch((error: unknown) => error);
    expect(isRefusal(again, OutOfStockError)).toBe(true);
    expect(shop.placed).toBe(0);
  });

  it("answers a second call with the same key and input while the first runs: in progress; other input: reused", async () => {
    const { pipeline, flaky } = setup();
    flaky.mode = "wait";
    const call = (quantity: number) =>
      pipeline.execute(FlakyAction, { quantity }, { actor: customer, idempotencyKey: "k1" });
    const first = call(1);
    await vi.waitFor(() => expect(flaky.ran).toBe(1));
    await expect(call(1)).rejects.toBeInstanceOf(IdempotencyKeyInProgressError);
    await expect(call(2)).rejects.toBeInstanceOf(IdempotencyKeyReusedError);
    flaky.release();
    expect(await first).toEqual({ ran: 2 });
    expect(await call(1)).toEqual({ ran: 2 });
    expect(flaky.ran).toBe(1);
  });

  it("replays a non-retryable refusal for a retry, equal but for the request id, and runs handle once", async () => {
    const { pipeline, flaky } = setup();
    flaky.mode = "refuse";
    const call = () =>
      pipeline.execute(FlakyAction, { quantity: 1 }, { actor: customer, idempotencyKey: "k1" });
    const first = await call().catch((error: unknown) => error);
    const again = await call().catch((error: unknown) => error);
    expect(first).toBeInstanceOf(OutOfStockError);
    expect(isRefusal(again, OutOfStockError)).toBe(true);
    expect((again as Refusal).toEnvelope()).toEqual((first as Refusal).toEnvelope());
    expect((again as Refusal).kind).toBe(ErrorKind.Conflict);
    expect(flaky.ran).toBe(1);
  });

  it("stores a refusal only under a key the caller sent; an input-derived key is released, so a later call runs", async () => {
    const derived = new DerivedFlakyAction();
    const { pipeline } = setup([[DerivedFlakyAction, derived]]);
    // A console user's call: Derived, keyed by its input. Out of stock now, in stock later: the retry must run.
    derived.mode = "refuse";
    await expect(
      pipeline.execute(
        DerivedFlakyAction,
        { quantity: 1 },
        { actor: customer, idempotencyKey: "k-click" },
      ),
    ).rejects.toBeInstanceOf(OutOfStockError);
    derived.mode = "ok";
    expect(
      await pipeline.execute(
        DerivedFlakyAction,
        { quantity: 1 },
        { actor: customer, idempotencyKey: "k-click-2" },
      ),
    ).toEqual({ ran: 3 });
    expect(derived.ran).toBe(2);
    // An API key sends its own key: its refusal is the answer for that key.
    const origin = { kind: CallOriginKind.ApiKey, id: "key_1" };
    derived.mode = "refuse";
    const call = () =>
      pipeline.execute(
        DerivedFlakyAction,
        { quantity: 5 },
        { actor: customer, idempotencyKey: "k-api", origin },
      );
    await expect(call()).rejects.toBeInstanceOf(OutOfStockError);
    derived.mode = "ok";
    const again = await call().catch((error: unknown) => error);
    expect(isRefusal(again, OutOfStockError)).toBe(true);
    expect(derived.ran).toBe(3);
  });

  it("releases the key of a retryable refusal or a plain error, so the retry runs handle again", async () => {
    const { pipeline, flaky } = setup();
    const call = () =>
      pipeline.execute(FlakyAction, { quantity: 1 }, { actor: customer, idempotencyKey: "k1" });
    flaky.mode = "retryable";
    await expect(call()).rejects.toBeInstanceOf(RateLimitedError);
    await expect(call()).rejects.toBeInstanceOf(RateLimitedError);
    expect(flaky.ran).toBe(2);
    flaky.mode = "crash";
    await expect(call()).rejects.toBeInstanceOf(TypeError);
    await expect(call()).rejects.toBeInstanceOf(TypeError);
    expect(flaky.ran).toBe(4);
    flaky.mode = "ok";
    expect(await call()).toEqual({ ran: 6 });
  });

  it("never stores or replays the output of an Idempotency.Never action, even with a key", async () => {
    const claimed: string[] = [];
    class Recording extends MemoryIdempotencyStoreDriver {
      override async claim(...args: Parameters<MemoryIdempotencyStoreDriver["claim"]>) {
        claimed.push(args[0]);
        return super.claim(...args);
      }
    }
    const action = new PickupSecretAction();
    const { pipeline } = setup([
      [IdempotencyStore, new Recording(new FixedClock())],
      [PickupSecretAction, action],
    ]);
    const first = await pipeline.execute(
      PickupSecretAction,
      {},
      { actor: customer, idempotencyKey: "k1" },
    );
    const again = await pipeline.execute(
      PickupSecretAction,
      {},
      { actor: customer, idempotencyKey: "k1" },
    );
    expect(first).toEqual({ token: "token-1" });
    expect(again).toEqual({ token: "token-2" });
    expect(action.picked).toBe(2);
    expect(claimed).toEqual([]);
  });

  describe("retention window (IdempotencyRetentionSource)", () => {
    /** Records the ttl each claim passes. */
    class Recording extends MemoryIdempotencyStoreDriver {
      readonly ttls: unknown[] = [];

      override async claim(...args: Parameters<MemoryIdempotencyStoreDriver["claim"]>) {
        this.ttls.push(args[2]);
        return super.claim(...args);
      }
    }

    /** Answers a fixed window, or fails. */
    class Retention extends Driver(IdempotencyRetentionSource) {
      private readonly answer: Duration | Error;

      constructor(answer: Duration | Error) {
        super();
        this.answer = answer;
      }

      async retention(): Promise<Duration> {
        if (this.answer instanceof Error) throw this.answer;
        return this.answer;
      }
    }

    /** The ttl a keyed `CreateOrderAction` call claims with `source` bound (none when absent). */
    async function claimedWith(source?: Retention): Promise<unknown[]> {
      const store = new Recording(new FixedClock());
      const { pipeline } = setup([
        [IdempotencyStore, store],
        ...(source === undefined ? [] : [[IdempotencyRetentionSource, source] as const]),
      ]);
      await pipeline.execute(
        CreateOrderAction,
        { quantity: 1 },
        { actor: customer, idempotencyKey: "k1" },
      );
      return store.ttls;
    }

    it("keeps a key 24 hours when no source is bound", async () => {
      expect(await claimedWith()).toEqual([Duration.hours(24)]);
    });

    it("shortens the window to the bound source's answer", async () => {
      expect(await claimedWith(new Retention(Duration.hours(2)))).toEqual([Duration.hours(2)]);
    });

    it("never lengthens the window past 24 hours", async () => {
      expect(await claimedWith(new Retention(Duration.hours(48)))).toEqual([Duration.hours(24)]);
    });

    it("fails the call when the source cannot be read", async () => {
      await expect(claimedWith(new Retention(new Error("down")))).rejects.toThrow("down");
    });

    it("lets an action's own shorter window win over the setting", async () => {
      onTestFinished(() => {
        ACTION_REGISTRY.delete(RegisterEndpointAction);
      });
      registerActions([
        {
          type: RegisterEndpointAction,
          key: "webhooks.endpoint.register@1",
          // oxlint-disable-next-line stackra/no-raw-key-literal -- reason: the test stands in for gen, which writes these registrations
          permission: "webhooks.endpoint.register",
          risk: "L2",
          output: RegisterEndpointOutput,
        },
      ]);
      const store = new Recording(new FixedClock());
      const { pipeline } = setup([
        [IdempotencyStore, store],
        [IdempotencyRetentionSource, new Retention(Duration.hours(2))],
        [RegisterEndpointAction, new RegisterEndpointAction()],
      ]);
      await pipeline.execute(RegisterEndpointAction, {}, { actor: customer, idempotencyKey: "k1" });
      expect(store.ttls).toEqual([Duration.minutes(10)]);
    });
  });

  it("never keeps a @ShownOnce output field: the replay omits it and says so", async () => {
    onTestFinished(() => {
      ACTION_REGISTRY.delete(RegisterEndpointAction);
    });
    registerActions([
      {
        type: RegisterEndpointAction,
        key: "webhooks.endpoint.register@1",
        // oxlint-disable-next-line stackra/no-raw-key-literal -- reason: the test stands in for gen, which writes these registrations
        permission: "webhooks.endpoint.register",
        risk: "L2",
        output: RegisterEndpointOutput,
      },
    ]);
    const stored: { output: unknown; ttl?: unknown }[] = [];
    class Recording extends MemoryIdempotencyStoreDriver {
      override async claim(...args: Parameters<MemoryIdempotencyStoreDriver["claim"]>) {
        stored.push({ output: undefined, ttl: args[2] });
        return super.claim(...args);
      }

      override async complete(key: string, output: unknown) {
        stored.push({ output });
        return super.complete(key, output);
      }
    }
    const action = new RegisterEndpointAction();
    const { pipeline } = setup([
      [IdempotencyStore, new Recording(new FixedClock())],
      [RegisterEndpointAction, action],
    ]);
    const first = await pipeline.execute(
      RegisterEndpointAction,
      {},
      { actor: customer, idempotencyKey: "k1" },
    );
    const again = await pipeline.execute(
      RegisterEndpointAction,
      {},
      { actor: customer, idempotencyKey: "k1" },
    );
    expect(first).toEqual({ endpointId: "whe_1", signingSecret: "whsec_1" });
    expect(again).toEqual({ endpointId: "whe_1", secretOmitted: true });
    expect(action.registered).toBe(1);
    expect(stored[0]?.ttl).toEqual(Duration.minutes(10));
    expect(stored[1]?.output).toEqual({ endpointId: "whe_1", secretOmitted: true });
    expect(JSON.stringify(stored)).not.toContain("whsec_");
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

  it("keeps a Derived action deduplicated by input when a client sends a fresh key per call, but not for an API key", async () => {
    const refunds = new IssueRefundAction();
    const { pipeline } = setup([[IssueRefundAction, refunds]]);
    // A double click: the generated client mints a new Idempotency-Key for each call, with the same input.
    const first = await pipeline.execute(
      IssueRefundAction,
      { paymentId: "pay_1" },
      { actor: customer, idempotencyKey: "k-click-1" },
    );
    const second = await pipeline.execute(
      IssueRefundAction,
      { paymentId: "pay_1" },
      { actor: customer, idempotencyKey: "k-click-2" },
    );
    expect(second).toEqual(first);
    expect(refunds.issued).toBe(1);
    // An API key sends its own keys: two keys are two intents.
    const origin = { kind: CallOriginKind.ApiKey, id: "key_1" };
    await pipeline.execute(
      IssueRefundAction,
      { paymentId: "pay_2" },
      { actor: customer, idempotencyKey: "k-api-1", origin },
    );
    await pipeline.execute(
      IssueRefundAction,
      { paymentId: "pay_2" },
      { actor: customer, idempotencyKey: "k-api-2", origin },
    );
    expect(refunds.issued).toBe(3);
  });

  it("refuses a keyed call that joined a running transaction when the store cannot join it", async () => {
    class Joined extends Transactions {
      override inTransaction(): boolean {
        return true;
      }
    }
    const memory = new MemoryIdempotencyStoreDriver(new FixedClock());
    const refused = setup([
      [UnitOfWork, new Joined()],
      [IdempotencyStore, memory],
    ]);
    await expect(
      refused.pipeline.execute(
        CreateOrderAction,
        { quantity: 1 },
        { actor: customer, idempotencyKey: "k-joined" },
      ),
    ).rejects.toBeInstanceOf(IdempotencyStoreNotTransactionalError);
    expect(refused.shop.placed).toBe(0);
    // nothing was claimed: the same key runs once the store can join
    class Joining extends MemoryIdempotencyStoreDriver {
      override readonly joinsTransaction = true;
    }
    const joining = setup([
      [UnitOfWork, new Joined()],
      [IdempotencyStore, new Joining(new FixedClock())],
    ]);
    expect(
      await joining.pipeline.execute(
        CreateOrderAction,
        { quantity: 1 },
        { actor: customer, idempotencyKey: "k-joined" },
      ),
    ).toEqual({ orderId: "ord_1", key: "k-joined" });
    // a call without a key (an action that declares no idempotency) never needs the store, joined or not
    await expect(
      refused.pipeline.execute(InspectAction, {}, { actor: customer }),
    ).resolves.toBeDefined();
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

  it("gives an action with no rateLimit the configured per-scope and per-address buckets (STA-1588)", async () => {
    const scoped = Object.assign(new RateLimitConfig(), {
      areas: {},
      actionDefault: { perScope: 1, perAddress: 100 },
    });
    const first = setup([[RateLimitConfig, scoped]]).pipeline;
    const read = (actor: Actor) => first.execute(GetOrderQuery, { orderId: "ord_1" }, { actor });
    await read(customer);
    await expect(read(customer)).rejects.toMatchObject({ code: "rate_limited", limit: 1 });
    // Another scope has its own bucket.
    await read({ ...customer, id: "usr_9", scopeId: "ten_9" });

    const perAddress = Object.assign(new RateLimitConfig(), {
      areas: {},
      actionDefault: { perScope: 100, perAddress: 1 },
    });
    const second = setup([[RateLimitConfig, perAddress]]).pipeline;
    const from = (actor: Actor, address: string) =>
      second.execute(GetOrderQuery, { orderId: "ord_1" }, { actor, client: { address } });
    await from(customer, "203.0.113.7");
    // One address shares its bucket across scopes; another address has its own.
    await expect(
      from({ ...customer, id: "usr_9", scopeId: "ten_9" }, "203.0.113.7"),
    ).rejects.toBeInstanceOf(RateLimitedError);
    await from(customer, "203.0.113.8");
  });

  it("lets an action's own rateLimit replace the default buckets, and hands the store no address", async () => {
    const keys: string[] = [];
    class Keys extends MemoryRateLimitStoreDriver {
      override async take(key: string, bucket: RateLimitBucket, now: Date) {
        keys.push(key);
        return super.take(key, bucket, now);
      }
    }
    const config = Object.assign(new RateLimitConfig(), { areas: {} });
    const { pipeline } = setup([
      [RateLimitConfig, config],
      [RateLimitStore, new Keys()],
    ]);
    const client = { address: "203.0.113.7" };
    await pipeline.execute(SendMessageAction, { text: "hi" }, { actor: customer, client });
    expect(keys).toEqual(["action:message.send:principal:usr_1"]);
    keys.length = 0;
    await pipeline.execute(GetOrderQuery, { orderId: "ord_1" }, { actor: customer, client });
    expect(keys).toHaveLength(2);
    expect(keys[0]).toBe("action:order.get:scope:ten_1");
    expect(keys[1]).toMatch(/^action:order\.get:address:[0-9a-f]{64}$/);
    expect(keys.join()).not.toContain("203.0.113.7");
  });

  describe("scope caps (RateLimitCapSource)", () => {
    const NO_CAPS: RateLimitCaps = {
      perMinute: null,
      burst: null,
      actionPerScope: null,
      actionPerAddress: null,
    };
    const ACME: ScopeRef = { id: "scp_1", path: "platform.acme" };

    /** Answers `caps` and records what was asked. */
    class Caps extends Driver(RateLimitCapSource) {
      readonly asked: unknown[] = [];

      private readonly answer: Partial<RateLimitCaps> | Error;

      constructor(answer: Partial<RateLimitCaps> | Error) {
        super();
        this.answer = answer;
      }

      async caps(area: string, scope: ScopeRef | undefined): Promise<RateLimitCaps> {
        this.asked.push([area, scope]);
        if (this.answer instanceof Error) throw this.answer;
        return { ...NO_CAPS, ...this.answer };
      }
    }

    /** A pipeline whose `app` area holds `burst` calls, with `caps` bound. */
    function capped(
      burst: number,
      caps: Caps,
      actionDefault = { perScope: 1200, perAddress: 300 },
    ) {
      const config = Object.assign(new RateLimitConfig(), {
        areas: { app: { requests: burst, per: Duration.minutes(1), burst } },
        actionDefault,
      });
      const { pipeline } = setup([
        [RateLimitConfig, config],
        [RateLimitCapSource, caps],
      ]);
      return () =>
        pipeline.execute(GetOrderQuery, { orderId: "ord_1" }, { actor: customer, scope: ACME });
    }

    it("keeps the configured bucket when the scope sets no cap", async () => {
      const caps = new Caps({});
      const read = capped(2, caps);
      await read();
      await read();
      await expect(read()).rejects.toMatchObject({ code: "rate_limited", limit: 2 });
      expect(caps.asked[0]).toEqual(["app", ACME]);
    });

    it("lowers the area bucket to a smaller cap", async () => {
      const read = capped(5, new Caps({ burst: 1, perMinute: 1 }));
      await read();
      await expect(read()).rejects.toMatchObject({
        code: "rate_limited",
        limit: 1,
        retryAfterMs: expect.closeTo(60_000, -1),
      });
    });

    it("never raises a limit: a larger cap keeps the configured bucket", async () => {
      const read = capped(1, new Caps({ burst: 100, perMinute: 100 }));
      await read();
      await expect(read()).rejects.toMatchObject({ code: "rate_limited", limit: 1 });
    });

    it("lowers the default action bucket to a smaller cap, never raises it", async () => {
      const lowered = capped(100, new Caps({ actionPerScope: 1 }));
      await lowered();
      await expect(lowered()).rejects.toMatchObject({ code: "rate_limited", limit: 1 });
      const raised = capped(100, new Caps({ actionPerScope: 50 }), {
        perScope: 1,
        perAddress: 300,
      });
      await raised();
      await expect(raised()).rejects.toMatchObject({ code: "rate_limited", limit: 1 });
    });

    it("refuses the call when the caps cannot be read", async () => {
      const read = capped(100, new Caps(new Error("settings store down")));
      await expect(read()).rejects.toThrow("settings store down");
    });
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

  it("gives an agent with no tenant of its own its human's tenant, and a platform agent none", async () => {
    const { pipeline } = setup();
    const background: Actor = { kind: ActorKind.Agent, id: "agt_1", onBehalfOf: customer };
    const platformAgent: Actor = {
      kind: ActorKind.Agent,
      id: "agt_1",
      onBehalfOf: { kind: ActorKind.User, id: "usr_2", realm: Realm.Staff },
    };
    await expect(pipeline.execute(InspectAction, {}, { actor: background })).resolves.toMatchObject(
      {
        scopeId: "ten_1",
      },
    );
    const output = (await pipeline.execute(InspectAction, {}, { actor: platformAgent })) as {
      scopeId?: string;
    };
    expect(output.scopeId).toBeUndefined();
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

  it("refuses a revoked device's call before device order, so nothing runs and its sequence stays", async () => {
    const devices = new MemoryDeviceSequenceStoreDriver();
    const status = new MemoryDeviceStatusReaderDriver();
    status.revoke("dev_lost");
    const { pipeline, shop } = setup([
      [DeviceSequenceStore, devices],
      [DeviceStatusReader, status],
    ]);
    const call = (deviceId: string, key: string) =>
      pipeline.execute(
        CreateOrderAction,
        { quantity: 1 },
        { actor: customer, idempotencyKey: key, scope: SCOPE, device: { deviceId, sequence: 5 } },
      );
    await expect(call("dev_lost", "k1")).rejects.toBeInstanceOf(DeviceRevokedError);
    await expect(call("dev_lost", "k2")).rejects.toMatchObject({ code: "device_revoked" });
    expect(await devices.last("dev_lost")).toBeUndefined();
    expect(shop.placed).toBe(0);
    expect(await call("dev_kept", "k3")).toEqual({ orderId: "ord_1", key: "k3" });
    // A call without a sequence from the revoked device is refused too: the reader is asked whenever a call carries one.
    await expect(
      pipeline.execute(InspectAction, {}, { actor: customer, device: { deviceId: "dev_lost" } }),
    ).rejects.toBeInstanceOf(DeviceRevokedError);
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

/** Parks every call: the rules always ask for one approval. */
class Approvals extends Driver(ApprovalGate) {
  readonly seen: [string, unknown, ApprovalRequirement | undefined][] = [];

  readonly parked: ApprovalDraft[] = [];

  async decide(
    call: CallDescriptor,
    input: unknown,
    declared: ApprovalRequirement | undefined,
  ): Promise<ApprovalRequirement | undefined> {
    log.push("approval");
    this.seen.push([call.key, input, declared]);
    return { approvals: 1, expiresAfter: "72h" };
  }

  async park(draft: ApprovalDraft): Promise<void> {
    this.parked.push(draft);
  }

  async find(): Promise<ApprovalRecord | undefined> {
    return undefined;
  }

  async begin(): Promise<boolean> {
    return false;
  }

  async settle(): Promise<boolean> {
    return false;
  }
}

/** An identity that knows everyone by a unique verified email. */
class SilentIdentity extends IdentityResolver {
  async emailOf(id: PublicId<"usr">): Promise<Email> {
    return `${id}@acme.example`;
  }

  async principalOf(id: PublicId<"usr">): Promise<VerifiedPrincipal> {
    return { id, email: `${id}@acme.example`, locale: "en" };
  }

  async principalByVerifiedEmail(): Promise<VerifiedPrincipal | null> {
    return null;
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
  it("parks a call at the approval step, before idempotency, with its binding written after the refusal", async () => {
    const approvals = new Approvals();
    const bindings = new MemoryApprovalBindingStoreDriver();
    const { pipeline } = setup([
      [ApprovalGate, approvals],
      [ApprovalBindingStore, bindings],
    ]);
    const refused = await pipeline
      .execute(
        CreateOrderAction,
        { quantity: 1 },
        { actor: customer, idempotencyKey: "k-approval" },
      )
      .catch((error: unknown) => error);
    expect(refused).toMatchObject({ code: "approval_required", approvalsRequired: 1 });
    const { approvalId } = refused as { approvalId: string };
    expect(approvalId).toMatch(/^apr_/);
    expect(log.indexOf("approval")).toBeGreaterThan(log.indexOf("flag"));
    expect(log).not.toContain("handle");
    expect(approvals.parked).toHaveLength(1);
    expect(approvals.parked[0]).toMatchObject({
      approvalId,
      key: "order.create",
      snapshot: { quantity: 1 },
      execute: "on_resubmit",
    });
    expect(await bindings.find(approvalId)).toMatchObject({
      approvalId,
      key: "order.create",
      execute: "on_resubmit",
      requester: customer,
    });
  });

  it("refuses a resubmission naming an approval the store does not have", async () => {
    const { pipeline } = setup([
      [ApprovalGate, new Approvals()],
      [ApprovalBindingStore, new MemoryApprovalBindingStoreDriver()],
      [ActorStatusCheck, new MemoryActorStatusCheckDriver()],
      [IdentityResolver, new SilentIdentity()],
    ]);
    await expect(
      pipeline.execute(
        CreateOrderAction,
        { quantity: 1 },
        { actor: customer, approvalId: "apr_none" },
      ),
    ).rejects.toMatchObject({ code: "approval_mismatch" });
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

/** A step-up action that users, services and agents all call (STA-340, Q-001). */
class RevokeKeyAction extends Action({
  key: "api_key.revoke",
  actors: [ActorKind.User, ActorKind.Service, ActorKind.Agent],
  stepUp: AssuranceLevel.Aal2,
}) {
  async handle(): Promise<string> {
    log.push("handle");
    return "revoked";
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

  it("asks no step-up of a service or agent caller, even with no StepUpCheck bound (STA-340)", async () => {
    const { pipeline } = setup([[RevokeKeyAction, new RevokeKeyAction()]]);
    const service: Actor = { kind: ActorKind.Service, id: "svc_ops", scopeId: "ten_1" };
    expect(await pipeline.execute(RevokeKeyAction, {}, { actor: service })).toBe("revoked");
    expect(await pipeline.execute(RevokeKeyAction, {}, { actor: agent })).toBe("revoked");
    expect(log).not.toContain("step_up");
  });

  it("still asks a user caller of the same action, and fails closed with none bound (STA-340)", async () => {
    const unbound = setup([[RevokeKeyAction, new RevokeKeyAction()]]).pipeline;
    await expect(
      unbound.execute(RevokeKeyAction, {}, { actor: customer, assurance: strong }),
    ).rejects.toThrow(/StepUpCheck is not bound/);
    const stepUp = new LevelStepUp();
    const { pipeline } = setup([
      [StepUpCheck, stepUp],
      [RevokeKeyAction, new RevokeKeyAction()],
    ]);
    expect(
      await pipeline.execute(RevokeKeyAction, {}, { actor: customer, assurance: strong }),
    ).toBe("revoked");
    expect(stepUp.seen).toEqual([["api_key.revoke", strong, "aal2"]]);
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
      [ApprovalBindingStore, new MemoryApprovalBindingStoreDriver()],
      [ApprovedRefundAction, new ApprovedRefundAction()],
    ]);
    await expect(
      pipeline.execute(ApprovedRefundAction, {}, { actor: customer }),
    ).rejects.toMatchObject({ code: "approval_required" });
    expect(approvals.seen.at(-1)?.[0]).toBe("order.refund");
    expect(approvals.seen.at(-1)?.[2]).toBeUndefined();
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

  continueTrace<T>(_carrier: TraceCarrier, work: () => Promise<T>): Promise<T> {
    return work();
  }

  traceparent(): string | undefined {
    return undefined;
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
    // A measured latency could equal the input value 7 (it did once, at 7 ms); a frozen clock makes it a known 0.
    const now = vi.spyOn(globalThis.performance, "now").mockReturnValue(1000);
    onTestFinished(() => now.mockRestore());
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
    expect(span?.set).toMatchObject({ outcome: "ok", latencyMs: 0 });
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

/** Replica reads in memory: records where each read ran and keeps a 5-second window per writer. */
class RecordingReplicaReads extends Driver(ReplicaReads) {
  readonly writes = new Map<string, number>();

  readonly reads: string[] = [];

  async onReplica<T>(work: () => Promise<T>): Promise<T> {
    this.reads.push("replica");
    return work();
  }

  async wrote(writer: string, at: Date): Promise<void> {
    this.writes.set(writer, at.getTime());
  }

  async pinned(writer: string, at: Date, lastWriteAt?: Date): Promise<boolean> {
    const last = Math.max(
      this.writes.get(writer) ?? -Infinity,
      lastWriteAt?.getTime() ?? -Infinity,
    );
    return at.getTime() - last < 5000;
  }
}

/** A query that reads the replica. */
class VisitsQuery extends Query({
  key: "visit.list",
  actors: [ActorKind.User],
  reads: "replica",
}) {
  async handle(): Promise<string> {
    return "visits";
  }
}

/** A pipeline with recording replica reads and the replica query bound. */
function withReplicaReads() {
  const reads = new RecordingReplicaReads();
  const { pipeline, shop } = setup([
    [ReplicaReads, reads],
    [VisitsQuery, new VisitsQuery()],
  ]);
  return { pipeline, reads, shop };
}

describe("ActionPipeline replica reads (STA-1504)", () => {
  it("runs a reads: replica query on the replica", async () => {
    const { pipeline, reads } = withReplicaReads();
    await expect(pipeline.execute(VisitsQuery, {}, { actor: customer })).resolves.toBe("visits");
    expect(reads.reads).toEqual(["replica"]);
  });

  it("keeps a primary query on the primary", async () => {
    const { pipeline, reads } = withReplicaReads();
    await pipeline.execute(GetOrderQuery, { orderId: "ord_1" }, { actor: customer });
    expect(reads.reads).toEqual([]);
  });

  it("pins the caller to the primary after its own committed write, in its scope", async () => {
    const { pipeline, reads } = withReplicaReads();
    await pipeline.execute(
      CreateOrderAction,
      { quantity: 1 },
      { actor: customer, scope: SCOPE, idempotencyKey: "k1" },
    );
    expect([...reads.writes.keys()]).toEqual([`${SCOPE.id}:usr_1`]);
    await pipeline.execute(VisitsQuery, {}, { actor: customer, scope: SCOPE });
    expect(reads.reads).toEqual([]);
    await pipeline.execute(VisitsQuery, {}, { actor: { ...customer, id: "usr_2" }, scope: SCOPE });
    expect(reads.reads).toEqual(["replica"]);
  });

  it("opens no window for a refused write", async () => {
    const { pipeline, reads, shop } = withReplicaReads();
    shop.failNext = true;
    await expect(
      pipeline.execute(
        CreateOrderAction,
        { quantity: 1 },
        { actor: customer, idempotencyKey: "k" },
      ),
    ).rejects.toBeInstanceOf(OutOfStockError);
    expect(reads.writes.size).toBe(0);
  });

  it("reads the primary inside a window the transport carried, and the replica after it", async () => {
    const { pipeline, reads } = withReplicaReads();
    await pipeline.execute(
      VisitsQuery,
      {},
      { actor: customer, lastWriteAt: new Date(NOW.getTime() - 1000) },
    );
    expect(reads.reads).toEqual([]);
    await pipeline.execute(
      VisitsQuery,
      {},
      { actor: customer, lastWriteAt: new Date(NOW.getTime() - 60_000) },
    );
    expect(reads.reads).toEqual(["replica"]);
  });

  it("reads the primary when no ReplicaReads is bound", async () => {
    const { pipeline } = setup([[VisitsQuery, new VisitsQuery()]]);
    await expect(pipeline.execute(VisitsQuery, {}, { actor: customer })).resolves.toBe("visits");
  });
});

/** A server-side analytics event that declares one field. */
class LeadSubmitted extends AnalyticsEvent({ name: "lead.submitted" }) {
  leadId!: string;
}

registerSchemas([[LeadSubmitted, z.object({ leadId: z.string() })]]);

/** An action that tracks the generic event and can be refused. */
class SubmitLeadAction extends Action({
  key: "lead.submit",
  actors: [ActorKind.User],
  analytics: true,
}) {
  refuse = false;

  async handle(): Promise<{ leadId: string }> {
    log.push("handle");
    if (this.refuse) throw OutOfStockError.create();
    return { leadId: "led_1" };
  }
}

/** An action that tracks a declared analytics event from its output. */
class CaptureLeadAction extends Action({
  key: "lead.capture",
  actors: [ActorKind.User],
  idempotency: Idempotency.Optional,
  analytics: LeadSubmitted,
}) {
  output: object = { leadId: "led_2", email: "a@example.com" };

  async handle(): Promise<object> {
    return this.output;
  }
}

/** A query that tracks the generic event. */
class LeadsQuery extends Query({
  key: "lead.list",
  actors: [ActorKind.User],
  analytics: true,
}) {
  async handle(): Promise<string[]> {
    return [];
  }
}

/** A pipeline with the outbox, the consent check and the analytics callers bound. */
function withAnalytics() {
  const outbox = new Outbox();
  const submit = new SubmitLeadAction();
  const capture = new CaptureLeadAction();
  const { pipeline, lines } = setup([
    [EventOutbox, outbox],
    [ConsentCheck, new RecordingConsentCheck()],
    [SubmitLeadAction, submit],
    [CaptureLeadAction, capture],
    [LeadsQuery, new LeadsQuery()],
  ]);
  const tracked = () =>
    outbox.written
      .map((record) => record.event)
      .filter((event) => event instanceof AnalyticsTracked);
  return { pipeline, outbox, submit, capture, lines, tracked };
}

const GRANTED = {
  actor: customer,
  scope: SCOPE,
  consentSnapshot: "good",
  locale: "ar-SA",
} as const;

describe("ActionPipeline analytics (STA-1512)", () => {
  it("writes action.called in the unit of work with the consent subject, user and call ids", async () => {
    const { pipeline, tracked } = withAnalytics();
    await pipeline.execute(SubmitLeadAction, {}, { ...GRANTED, callId: "call_1" });
    expect(log.indexOf("outbox")).toBeLessThan(log.indexOf("commit"));
    expect(tracked()).toEqual([
      expect.objectContaining({
        name: "action.called",
        properties: { key: "lead.submit", outcome: "ok", durationMs: expect.any(Number) },
        anonymousId: "anon_1",
        userId: "usr_1",
        callId: "call_1",
        key: "lead.submit",
        locale: "ar-SA",
        scopeId: SCOPE.id,
        occurredAt: NOW.toISOString(),
        eventId: expect.stringMatching(/^evt_/),
      }),
    ]);
  });

  it("writes action.called with the refusal code after a refused call", async () => {
    const { pipeline, submit, tracked } = withAnalytics();
    submit.refuse = true;
    await expect(pipeline.execute(SubmitLeadAction, {}, GRANTED)).rejects.toBeInstanceOf(
      OutOfStockError,
    );
    expect(tracked()).toEqual([
      expect.objectContaining({
        properties: expect.objectContaining({ outcome: "refused", code: "out_of_stock" }),
      }),
    ]);
  });

  it("writes a declared AnalyticsEvent with only its declared fields", async () => {
    const { pipeline, tracked } = withAnalytics();
    await pipeline.execute(CaptureLeadAction, {}, GRANTED);
    expect(tracked()).toEqual([
      expect.objectContaining({ name: "lead.submitted", properties: { leadId: "led_2" } }),
    ]);
  });

  it("skips a declared event the output does not fit, with a warning, and keeps the call", async () => {
    const { pipeline, capture, tracked } = withAnalytics();
    capture.output = { other: true };
    await expect(pipeline.execute(CaptureLeadAction, {}, GRANTED)).resolves.toEqual({
      other: true,
    });
    expect(tracked()).toEqual([]);
  });

  it("tracks nothing again for an idempotent replay", async () => {
    const { pipeline, tracked } = withAnalytics();
    await pipeline.execute(CaptureLeadAction, {}, { ...GRANTED, idempotencyKey: "k1" });
    await pipeline.execute(CaptureLeadAction, {}, { ...GRANTED, idempotencyKey: "k1" });
    expect(tracked()).toHaveLength(1);
  });

  it("writes a query's event after it answers", async () => {
    const { pipeline, tracked } = withAnalytics();
    await pipeline.execute(LeadsQuery, {}, GRANTED);
    expect(tracked()).toEqual([expect.objectContaining({ key: "lead.list" })]);
  });

  it("writes nothing without a snapshot that grants analytics", async () => {
    const { pipeline, tracked } = withAnalytics();
    await pipeline.execute(SubmitLeadAction, {}, { actor: customer });
    await pipeline.execute(SubmitLeadAction, {}, { actor: customer, consentSnapshot: "forged" });
    expect(tracked()).toEqual([]);
  });
});

/** A query budget that records each call it counts and runs the work as it is. */
class RecordingQueryBudget extends Driver(QueryBudget) {
  readonly calls: [string, number | undefined][] = [];

  override within<T>(key: string, budget: number | undefined, work: () => Promise<T>): Promise<T> {
    this.calls.push([key, budget]);
    return work();
  }
}

/** A query that declares a budget and reads one memoised value twice. */
class BudgetedQuery extends Query({
  key: "budget.read",
  actors: [ActorKind.User],
  queryBudget: 5,
}) {
  loads = 0;

  async handle(_input: object, ctx: QueryContext): Promise<number[]> {
    const load = async () => ++this.loads;
    return [await ctx.memo("rate", load), await ctx.memo("rate", load)];
  }
}

describe("ActionPipeline query budget and request memo (STA-1400)", () => {
  it("counts handle through QueryBudget with the call's key and budget", async () => {
    const budget = new RecordingQueryBudget();
    const { pipeline } = setup([
      [QueryBudget, budget],
      [BudgetedQuery, new BudgetedQuery()],
    ]);
    await pipeline.execute(BudgetedQuery, {}, { actor: customer });
    await pipeline.execute(GetOrderQuery, { orderId: "ord_1" }, { actor: customer });
    expect(budget.calls).toEqual([
      ["budget.read", 5],
      ["order.get", undefined],
    ]);
  });

  it("runs handle as it is when no QueryBudget is bound", async () => {
    const { pipeline } = setup([[BudgetedQuery, new BudgetedQuery()]]);
    await expect(pipeline.execute(BudgetedQuery, {}, { actor: customer })).resolves.toEqual([1, 1]);
  });

  it("memoises per call, never across calls", async () => {
    const query = new BudgetedQuery();
    const { pipeline } = setup([[BudgetedQuery, query]]);
    await expect(pipeline.execute(BudgetedQuery, {}, { actor: customer })).resolves.toEqual([1, 1]);
    await expect(pipeline.execute(BudgetedQuery, {}, { actor: customer })).resolves.toEqual([2, 2]);
  });
});

class LoggingIsolation extends Driver(CallIsolation) {
  readonly runs: [string, ScopeRef | readonly ScopeRef[] | undefined, boolean][] = [];

  async run<T>(
    actor: Actor,
    scope: ScopeRef | readonly ScopeRef[] | undefined,
    work: () => Promise<T>,
    options: { readonly readOnly: boolean },
  ): Promise<T> {
    this.runs.push([actor.id, scope, options.readOnly]);
    log.push(`isolation:${options.readOnly ? "read-only" : "write"}`);
    try {
      const output = await work();
      log.push("isolation:commit");
      return output;
    } catch (error) {
      log.push("isolation:rollback");
      throw error;
    }
  }
}

describe("ActionPipeline call isolation (ADR 0495)", () => {
  it("runs everything after the tenancy check in the isolation, the unit of work inside it, after-commit work after it", async () => {
    const isolation = new LoggingIsolation();
    const { pipeline } = setup([[CallIsolation, isolation]]);
    await pipeline.execute(
      CreateOrderAction,
      { quantity: 2 },
      { actor: customer, idempotencyKey: "k1" },
    );
    expect(log).toEqual([
      "tenancy",
      "isolation:write",
      "permission",
      "precondition",
      "entitlement",
      "flag",
      "interceptor:before",
      "begin",
      "handle",
      "commit",
      "interceptor:after",
      "isolation:commit",
      "after-commit:1",
      "after-commit:2",
    ]);
    expect(isolation.runs).toEqual([["usr_1", undefined, false]]);
  });

  it("runs a query read-only, with the call's scope", async () => {
    const isolation = new LoggingIsolation();
    const { pipeline } = setup([[CallIsolation, isolation]]);
    const scope: ScopeRef = { id: "scp_01j9z3k4m5n6p7q8r9s0t1v2w3", path: "platform.acme" };
    await pipeline.execute(GetOrderQuery, { orderId: "ord_1" }, { actor: customer, scope });
    expect(isolation.runs).toEqual([["usr_1", scope, true]]);
  });

  it("hands the isolation the actor the transport verified and the scope it resolved, whatever the input names (ADR 0098, STA-1823)", async () => {
    const seen: [Actor, ScopeRef | readonly ScopeRef[] | undefined][] = [];
    class Recording extends Driver(CallIsolation) {
      async run<T>(
        actor: Actor,
        scope: ScopeRef | readonly ScopeRef[] | undefined,
        work: () => Promise<T>,
      ): Promise<T> {
        seen.push([actor, scope]);
        return work();
      }
    }
    const { pipeline } = setup([[CallIsolation, new Recording()]]);
    const named = {
      scopeId: "scp_01j9z3k4m5n6p7q8r9s0t1v2w9",
      tenantId: "scp_01j9z3k4m5n6p7q8r9s0t1v2w9",
      scope: { id: "scp_01j9z3k4m5n6p7q8r9s0t1v2w9", path: "platform.other" },
      actor: { kind: ActorKind.User, id: "usr_9", scopeId: "scp_01j9z3k4m5n6p7q8r9s0t1v2w9" },
    };
    await pipeline.execute(
      GetOrderQuery,
      { orderId: "ord_1", ...named },
      { actor: customer, scope: SCOPE },
    );
    // a caller with no tenant stays one: nothing in the input gives it one
    const staff: Actor = { kind: ActorKind.User, id: "usr_2", realm: Realm.Staff };
    await pipeline.execute(GetOrderQuery, { orderId: "ord_1", ...named }, { actor: staff });
    expect(seen).toHaveLength(2);
    expect(seen[0]?.[0]).toBe(customer);
    expect(seen[0]?.[1]).toBe(SCOPE);
    expect(seen[1]?.[0]).toBe(staff);
    expect(seen[1]?.[0].scopeId).toBeUndefined();
    expect(seen[1]?.[1]).toBeUndefined();
  });

  it("does not run the isolation for a call the tenancy check refuses", async () => {
    class Suspended extends Driver(TenancyCheck) {
      async check(): Promise<void> {
        throw ForbiddenError.create();
      }
    }
    const isolation = new LoggingIsolation();
    const { pipeline } = setup([
      [TenancyCheck, new Suspended()],
      [CallIsolation, isolation],
    ]);
    await expect(
      pipeline.execute(GetOrderQuery, { orderId: "ord_1" }, { actor: customer }),
    ).rejects.toBeInstanceOf(ForbiddenError);
    expect(isolation.runs).toEqual([]);
  });

  it("rolls the isolation back and runs no after-commit work when permission refuses", async () => {
    const { pipeline, access } = setup([[CallIsolation, new LoggingIsolation()]]);
    access.denied = true;
    await expect(
      pipeline.execute(
        CreateOrderAction,
        { quantity: 1 },
        { actor: customer, idempotencyKey: "k2" },
      ),
    ).rejects.toBeInstanceOf(ForbiddenError);
    expect(log).toEqual(["tenancy", "isolation:write", "permission", "isolation:rollback"]);
  });

  it("writes a refused query's usage event after its read-only transaction ends", async () => {
    const config = Object.assign(new RateLimitConfig(), {
      areas: { app: { requests: 1, per: Duration.minutes(1), burst: 1 } },
    });
    const outbox = new Outbox();
    const { pipeline } = setup([
      [RateLimitConfig, config],
      [EventOutbox, outbox],
      [CallIsolation, new LoggingIsolation()],
    ]);
    const read = () =>
      pipeline.execute(
        GetOrderQuery,
        { orderId: "ord_1" },
        { actor: customer, origin: { kind: CallOriginKind.ApiKey, id: "key_1" } },
      );
    await read();
    log.length = 0;
    await expect(read()).rejects.toBeInstanceOf(RateLimitedError);
    expect(log.slice(-2)).toEqual(["isolation:rollback", "outbox"]);
  });

  it("writes a refused action's usage event after the isolation rolled back, so the rollback cannot undo it", async () => {
    const outbox = new Outbox();
    const { pipeline } = setup([
      [EventOutbox, outbox],
      [CallIsolation, new LoggingIsolation()],
    ]);
    await pipeline.execute(SendMessageAction, { text: "hi" }, { actor: customer });
    log.length = 0;
    await expect(
      pipeline.execute(SendMessageAction, { text: "again" }, { actor: customer }),
    ).rejects.toBeInstanceOf(RateLimitedError);
    expect(log.slice(-2)).toEqual(["isolation:rollback", "outbox"]);
    expect(outbox.written.at(-1)?.event).toMatchObject({
      meter: "actions.rate_limited",
      key: "message.send",
    });
  });
});

/** A coupon update needs approval above 5 percent. */
class AboveFiveCondition extends ApprovalCondition {
  async needed(input: { readonly percent: number }): Promise<boolean> {
    return input.percent > 5;
  }
}

const APPROVE = "billing.coupon.approve";

/** A condition that reads its threshold through its limited reader. */
class ThresholdCondition extends ApprovalCondition {
  static override readonly reads = ["billing.coupon.maxPercent"] as const;

  async needed(
    input: { readonly percent: number },
    _ctx: ActionContext,
    settings: ApprovalSettingsReader,
  ): Promise<boolean> {
    return input.percent > Number(await settings.get("billing.coupon.maxPercent"));
  }
}

/** A condition that reads a key it never declared. */
class GreedyCondition extends ApprovalCondition {
  async needed(
    _input: unknown,
    _ctx: ActionContext,
    settings: ApprovalSettingsReader,
  ): Promise<boolean> {
    return Boolean(await settings.get("billing.other"));
  }
}

class ThresholdAction extends Action({
  key: "coupon.threshold",
  actors: [ActorKind.User],
  approval: { permission: APPROVE, when: ThresholdCondition },
}) {
  async handle(): Promise<string> {
    return "ok";
  }
}

class GreedyAction extends Action({
  key: "coupon.greedy",
  actors: [ActorKind.User],
  approval: { permission: APPROVE, when: GreedyCondition },
}) {
  async handle(): Promise<string> {
    return "ok";
  }
}

/** A settings source over a map. */
class MapSettings extends Driver(ApprovalSettingsSource) {
  async get(key: string): Promise<unknown> {
    return { "billing.coupon.maxPercent": 20, "billing.other": true }[key];
  }
}

class CouponAction extends Action({
  key: "coupon.update",
  actors: [ActorKind.User, ActorKind.Agent],
  approval: { permission: APPROVE, when: AboveFiveCondition },
}) {
  async handle(input: { percent: number }): Promise<{ percent: number }> {
    log.push("handle");
    return { percent: input.percent };
  }
}

class LimitedCouponAction extends Action({
  key: "coupon.limited",
  actors: [ActorKind.User],
  approval: { permission: APPROVE },
  rateLimit: { perMinute: 1 },
}) {
  async handle(): Promise<string> {
    return "ok";
  }
}

class SteppedCouponAction extends Action({
  key: "coupon.rotate",
  actors: [ActorKind.User],
  stepUp: AssuranceLevel.Aal2,
  approval: { permission: APPROVE },
}) {
  async handle(): Promise<string> {
    log.push("handle");
    return "rotated";
  }
}

/** A gate whose answers a test may tamper with, as a writer of the store's table could. */
class TamperedGate extends MemoryApprovalGateDriver {
  tamper: ((record: ApprovalRecord) => ApprovalRecord) | undefined;

  override async find(approvalId: string): Promise<ApprovalRecord | undefined> {
    const record = await super.find(approvalId);
    return record !== undefined && this.tamper !== undefined ? this.tamper(record) : record;
  }
}

class CountingBindings extends MemoryApprovalBindingStoreDriver {
  inserts = 0;

  override async insert(binding: ApprovalBinding): Promise<void> {
    this.inserts += 1;
    return super.insert(binding);
  }
}

class RecordingStepUp extends Driver(StepUpCheck) {
  readonly calls: [CallAssurance | undefined, AssuranceLevel, Date | undefined][] = [];

  async require(
    _call: CallDescriptor,
    assurance: CallAssurance | undefined,
    level: AssuranceLevel,
    at?: Date,
  ): Promise<void> {
    this.calls.push([assurance, level, at]);
  }
}

const approver = (id: `usr_${string}`, extra: Partial<MemoryApprover> = {}): MemoryApprover => ({
  actor: { kind: ActorKind.User, id, realm: Realm.Staff, scopeId: "ten_1" },
  realm: Realm.Staff,
  permissions: [APPROVE],
  assurance: AssuranceLevel.Aal2,
  steppedUp: true,
  ...extra,
});

/** A pipeline with the whole approval stage bound over the memory drivers. */
function stage(
  options: { cap?: number; decide?: () => ApprovalRequirement | undefined } = {},
  extra: readonly (readonly [AnyClass, object])[] = [],
) {
  const identity = new SilentIdentity();
  const gate = TamperedGate.of({ identity, clock: new FixedClock(), ...options });
  const bindings = new CountingBindings();
  const actors = new MemoryActorStatusCheckDriver();
  const built = setup([
    [ApprovalGate, gate],
    [ApprovalBindingStore, bindings],
    [ActorStatusCheck, actors],
    [IdentityResolver, identity],
    [AboveFiveCondition, new AboveFiveCondition()],
    [CouponAction, new CouponAction()],
    [LimitedCouponAction, new LimitedCouponAction()],
    [SteppedCouponAction, new SteppedCouponAction()],
    ...extra,
  ]);
  return { ...built, gate, bindings, actors, identity };
}

/** One recorded staff vote of `id`. */
const vote = (id: `usr_${string}`) => ({
  voter: { kind: ActorKind.User, id, realm: Realm.Staff } as Actor,
  realm: Realm.Staff,
  at: NOW,
});

/** The refusal of a call, or throws when it ran. */
async function refusal(work: Promise<unknown>): Promise<Record<string, unknown>> {
  const refused = await work.then(
    () => undefined,
    (error: unknown) => error,
  );
  if (refused === undefined) throw new Error("the call ran");
  return refused as Record<string, unknown>;
}

describe("ActionPipeline approval stage (ADR 0509)", () => {
  it("parks a call whose condition is true: refused with the id, count and expiry, binding and request written", async () => {
    const { pipeline, gate, bindings, trail } = stage();
    const refused = await refusal(
      pipeline.execute(CouponAction, { percent: 40 }, { actor: customer }),
    );
    expect(refused).toMatchObject({
      code: "approval_required",
      approvalsRequired: 1,
      expiresAt: new Date(NOW.getTime() + 72 * 3_600_000).toISOString(),
    });
    const approvalId = refused.approvalId as string;
    expect(log).not.toContain("handle");
    expect(await gate.find(approvalId)).toMatchObject({
      status: "pending",
      key: "coupon.update",
      snapshot: { percent: 40 },
      execute: "on_grant",
    });
    const inputHash = await fingerprintOf("coupon.update", { percent: 40 });
    expect(await bindings.find(approvalId)).toMatchObject({
      key: "coupon.update",
      inputHash,
      requestedAt: NOW,
      approvals: 1,
      permission: APPROVE,
      execute: "on_grant",
    });
    expect(trail.entries.at(-1)).toMatchObject({
      outcome: "refused",
      code: "approval_required",
      fields: { approvalId, inputHash },
    });
  });

  it("hands a condition a reader limited to its reads, over the bound settings source", async () => {
    const { pipeline } = stage({}, [
      [ApprovalSettingsSource, new MapSettings()],
      [ThresholdCondition, new ThresholdCondition()],
      [ThresholdAction, new ThresholdAction()],
      [GreedyCondition, new GreedyCondition()],
      [GreedyAction, new GreedyAction()],
    ]);
    await expect(
      pipeline.execute(ThresholdAction, { percent: 30 }, { actor: customer }),
    ).rejects.toMatchObject({
      code: "approval_required",
    });
    await expect(
      pipeline.execute(ThresholdAction, { percent: 10 }, { actor: customer }),
    ).resolves.toBe("ok");
    // a key the condition did not declare throws: the call fails and is never read as "not needed"
    await expect(pipeline.execute(GreedyAction, {}, { actor: customer })).rejects.toThrow(
      RangeError,
    );
  });

  it("refuses a condition that declares reads when no settings source is bound, before needed() runs", async () => {
    const { pipeline, bindings } = stage({}, [
      [ThresholdCondition, new ThresholdCondition()],
      [ThresholdAction, new ThresholdAction()],
    ]);
    await expect(
      pipeline.execute(ThresholdAction, { percent: 30 }, { actor: customer }),
    ).rejects.toMatchObject({ code: "approval_settings_unavailable", retryable: false });
    expect(bindings.inserts).toBe(0);
    // a condition with no reads needs no source
    await expect(
      pipeline.execute(CouponAction, { percent: 3 }, { actor: customer }),
    ).resolves.toEqual({
      percent: 3,
    });
  });

  it("runs a call whose condition is false, and parks nothing", async () => {
    const { pipeline, bindings } = stage();
    await expect(
      pipeline.execute(CouponAction, { percent: 3 }, { actor: customer }),
    ).resolves.toEqual({ percent: 3 });
    expect(log).toContain("handle");
    expect(bindings.inserts).toBe(0);
  });

  it("raises the requirement when the rules ask for more, and keeps the floor when they ask for none", async () => {
    const more = stage({ decide: () => ({ approvals: 3, expiresAfter: "24h" }) });
    expect(
      await refusal(more.pipeline.execute(CouponAction, { percent: 40 }, { actor: customer })),
    ).toMatchObject({
      approvalsRequired: 3,
      expiresAt: new Date(NOW.getTime() + 24 * 3_600_000).toISOString(),
    });
    const none = stage({ decide: () => undefined });
    expect(
      await refusal(none.pipeline.execute(CouponAction, { percent: 40 }, { actor: customer })),
    ).toMatchObject({ code: "approval_required", approvalsRequired: 1 });
  });

  it("fails closed with the open gate, and with no binding store, status check or identity bound", async () => {
    const open = setup([
      [CouponAction, new CouponAction()],
      [AboveFiveCondition, new AboveFiveCondition()],
    ]);
    await expect(
      open.pipeline.execute(CouponAction, { percent: 40 }, { actor: customer }),
    ).rejects.toThrow(/cannot park/);
    const identity = new SilentIdentity();
    const gate = new MemoryApprovalGateDriver(identity, new FixedClock());
    const parts: [AnyClass, object][] = [
      [ApprovalBindingStore, new MemoryApprovalBindingStoreDriver()],
      [ActorStatusCheck, new MemoryActorStatusCheckDriver()],
      [IdentityResolver, identity],
    ];
    for (const missing of parts) {
      const { pipeline } = setup([
        [ApprovalGate, gate],
        [CouponAction, new CouponAction()],
        [AboveFiveCondition, new AboveFiveCondition()],
        ...parts.filter((part) => part !== missing),
      ]);
      await expect(
        pipeline.execute(CouponAction, { percent: 40 }, { actor: customer }),
      ).rejects.toThrow(/is not bound/);
    }
  });

  it("refuses a chain whose root is not a user before parking, and parks an agent acting for a user", async () => {
    const { pipeline, bindings } = stage();
    await expect(
      pipeline.execute(CouponAction, { percent: 40 }, { actor: agent }),
    ).rejects.toMatchObject({ code: "forbidden" });
    expect(bindings.inserts).toBe(0);
    await expect(
      pipeline.execute(
        CouponAction,
        { percent: 40 },
        { actor: { ...agent, onBehalfOf: customer } },
      ),
    ).rejects.toMatchObject({ code: "approval_required" });
    expect(bindings.inserts).toBe(1);
  });

  it("writes the request after the isolation transaction rolled back, in a fresh run", async () => {
    const isolation = new LoggingIsolation();
    const { pipeline, gate } = stage({}, [[CallIsolation, isolation]]);
    const refused = await refusal(
      pipeline.execute(CouponAction, { percent: 40 }, { actor: customer }),
    );
    expect(log.filter((entry) => entry.startsWith("isolation"))).toEqual([
      "isolation:write",
      "isolation:rollback",
      "isolation:write",
      "isolation:commit",
    ]);
    expect((await gate.find(refused.approvalId as string))?.status).toBe("pending");
  });

  it("takes a rate-limit token before the binding insert, so a refused token writes nothing", async () => {
    const { pipeline, bindings } = stage();
    await expect(
      pipeline.execute(LimitedCouponAction, {}, { actor: customer }),
    ).rejects.toMatchObject({ code: "approval_required" });
    expect(bindings.inserts).toBe(1);
    await expect(
      pipeline.execute(LimitedCouponAction, {}, { actor: customer }),
    ).rejects.toMatchObject({ code: "rate_limited" });
    expect(bindings.inserts).toBe(1);
  });

  it("surfaces a failed park, logging the id, key and code and never the input", async () => {
    const { pipeline, lines } = stage({ cap: 0 });
    await expect(
      pipeline.execute(CouponAction, { percent: 41 }, { actor: customer }),
    ).rejects.toMatchObject({ code: "approval_pending_limit" });
    const line = lines.errors.find(([event]) => event === APPROVAL_PARK_FAILED);
    // Exactly these fields: the input ({ percent: 41 }) never reaches the log.
    expect(line?.[1]).toEqual({
      approvalId: expect.any(String),
      key: "coupon.update",
      code: "approval_pending_limit",
    });
  });

  it("runs a granted on_grant request once, through the executor's begin, and records the voters", async () => {
    const { pipeline, gate, trail } = stage();
    const parked = await refusal(
      pipeline.execute(CouponAction, { percent: 40 }, { actor: customer }),
    );
    const approvalId = parked.approvalId as string;
    const resubmit = () =>
      pipeline.execute(CouponAction, { percent: 40 }, { actor: customer, approvalId });
    await expect(resubmit()).rejects.toMatchObject({ code: "approval_not_granted" });
    await gate.approve(approvalId, approver("usr_a"));
    // the requester resubmitting an on_grant request is refused: only the executor runs it (FR-013)
    await expect(resubmit()).rejects.toMatchObject({ code: "approval_consumed" });
    expect(await gate.begin(approvalId, `approval:${approvalId}`)).toBe(true);
    await expect(resubmit()).resolves.toEqual({ percent: 40 });
    await expect(resubmit()).resolves.toEqual({ percent: 40 });
    expect(log.filter((entry) => entry === "handle")).toHaveLength(1);
    expect(trail.entries.at(-1)).toMatchObject({
      outcome: "ok",
      fields: { approvalId, voters: ["usr_a"] },
    });
  });

  it("forces the key approval:<id> and refuses a caller's approval: key", async () => {
    const { pipeline, gate } = stage();
    const parked = await refusal(
      pipeline.execute(CouponAction, { percent: 40 }, { actor: customer }),
    );
    const approvalId = parked.approvalId as string;
    await gate.approve(approvalId, approver("usr_a"));
    await gate.begin(approvalId, `approval:${approvalId}`);
    await expect(
      pipeline.execute(
        CouponAction,
        { percent: 40 },
        { actor: customer, idempotencyKey: "approval:x" },
      ),
    ).rejects.toMatchObject({ code: "input_invalid" });
    // whatever key the caller sent, the run is under approval:<id>, so the second run replays the first
    await pipeline.execute(
      CouponAction,
      { percent: 40 },
      { actor: customer, approvalId, idempotencyKey: "mine" },
    );
    await pipeline.execute(
      CouponAction,
      { percent: 40 },
      { actor: customer, approvalId, idempotencyKey: "other" },
    );
    expect(log.filter((entry) => entry === "handle")).toHaveLength(1);
  });

  it("refuses every tampered binding or store row with approval_mismatch", async () => {
    const { pipeline, gate } = stage();
    const parked = await refusal(
      pipeline.execute(CouponAction, { percent: 40 }, { actor: customer }),
    );
    const approvalId = parked.approvalId as string;
    await gate.approve(approvalId, approver("usr_a"));
    await gate.begin(approvalId, `approval:${approvalId}`);
    const run = (input: { percent: number }, actor: Actor = customer) =>
      pipeline.execute(CouponAction, input, { actor, approvalId });
    // another input, another requester
    await expect(run({ percent: 41 })).rejects.toMatchObject({ code: "approval_mismatch" });
    await expect(run({ percent: 40 }, { ...customer, id: "usr_2" })).rejects.toMatchObject({
      code: "approval_mismatch",
    });
    // a writer of the store's table: a changed snapshot, requester, key or tenant
    const tampers: ((record: ApprovalRecord) => ApprovalRecord)[] = [
      (record) => ({ ...record, snapshot: { percent: 99 } }),
      (record) => ({ ...record, snapshot: undefined }),
      (record) => ({ ...record, requester: { ...record.requester, id: "usr_2" } as Actor }),
      (record) => ({ ...record, key: "coupon.other" }),
      (record) => ({ ...record, scopeId: "ten_2" }),
    ];
    for (const tamper of tampers) {
      gate.tamper = tamper;
      await expect(run({ percent: 40 })).rejects.toMatchObject({ code: "approval_mismatch" });
    }
    expect(log).not.toContain("handle");
  });

  it("refuses a granted request after 24 hours, by the owning service's clock", async () => {
    const { pipeline, gate } = stage();
    const parked = await refusal(
      pipeline.execute(CouponAction, { percent: 40 }, { actor: customer }),
    );
    const approvalId = parked.approvalId as string;
    await gate.approve(approvalId, approver("usr_a"));
    await gate.begin(approvalId, `approval:${approvalId}`);
    gate.tamper = (record) => ({ ...record, grantedAt: new Date(NOW.getTime() - 25 * 3_600_000) });
    await expect(
      pipeline.execute(CouponAction, { percent: 40 }, { actor: customer, approvalId }),
    ).rejects.toMatchObject({ code: "approval_expired" });
  });

  it("counts a person once, ignores a customer-realm vote, and refuses a vote by the requester's person", async () => {
    const { pipeline, gate } = stage();
    const parked = await refusal(
      pipeline.execute(CouponAction, { percent: 40 }, { actor: customer }),
    );
    const approvalId = parked.approvalId as string;
    await gate.approve(approvalId, approver("usr_a"));
    await gate.begin(approvalId, `approval:${approvalId}`);
    const run = () =>
      pipeline.execute(CouponAction, { percent: 40 }, { actor: customer, approvalId });
    gate.tamper = (record) => ({ ...record, votes: [] });
    await expect(run()).rejects.toMatchObject({ code: "approval_not_granted" });
    gate.tamper = (record) => ({
      ...record,
      votes: [vote("usr_b"), vote("usr_b"), { ...vote("usr_c"), realm: Realm.Customer }],
    });
    await expect(run()).resolves.toEqual({ percent: 40 });
    gate.tamper = (record) => ({ ...record, votes: [vote("usr_1")] });
    await expect(run()).rejects.toMatchObject({ code: "approval_mismatch" });
  });

  it("refuses retryably while identity cannot answer, and refuses an inactive requester or revoked sessions", async () => {
    const { pipeline, gate, actors } = stage();
    const parked = await refusal(
      pipeline.execute(CouponAction, { percent: 40 }, { actor: customer }),
    );
    const approvalId = parked.approvalId as string;
    await gate.approve(approvalId, approver("usr_a"));
    await gate.begin(approvalId, `approval:${approvalId}`);
    const run = () =>
      pipeline.execute(CouponAction, { percent: 40 }, { actor: customer, approvalId });
    actors.setOutage(true);
    await expect(run()).rejects.toMatchObject({
      code: "approval_identity_unavailable",
      retryable: true,
    });
    actors.setOutage(false);
    actors.markChanged(customer.id, new Date(NOW.getTime() + 3_600_000));
    await expect(run()).rejects.toMatchObject({ code: "step_up_required" });
    actors.deactivate(customer.id);
    await expect(run()).rejects.toMatchObject({ code: "forbidden" });
    expect(log).not.toContain("handle");
  });

  it("measures an approved call's step-up on the binding's assurance and request time, and sets the approver level", async () => {
    const stepUp = new RecordingStepUp();
    const { pipeline, gate } = stage({}, [[StepUpCheck, stepUp]]);
    const assurance: CallAssurance = {
      amr: ["pwd", "otp"],
      authTime: new Date(NOW.getTime() - 3_600_000),
      level: AssuranceLevel.Aal2,
    };
    const parked = await refusal(
      pipeline.execute(SteppedCouponAction, {}, { actor: customer, assurance }),
    );
    const approvalId = parked.approvalId as string;
    expect(stepUp.calls.at(-1)).toEqual([assurance, AssuranceLevel.Aal2, undefined]);
    // an approver of a stepUp action must step up, whatever the tenant's rule says (N6)
    await expect(
      gate.approve(approvalId, approver("usr_a", { assurance: AssuranceLevel.Aal1 })),
    ).rejects.toMatchObject({ refusal: "step_up_required" });
    await gate.approve(approvalId, approver("usr_a"));
    await gate.begin(approvalId, `approval:${approvalId}`);
    // the execution carries no live assurance: the binding's stands in, measured at the request
    await expect(
      pipeline.execute(SteppedCouponAction, {}, { actor: customer, approvalId }),
    ).resolves.toBe("rotated");
    expect(stepUp.calls.at(-1)).toEqual([assurance, AssuranceLevel.Aal2, NOW]);
  });
});

/** A tenant above the branch below. */
const TREE_TOP = "scp_01j9z3k4m5n6p7q8r9s0t1v2t1";

/** A branch of `TREE_TOP`. */
const TREE_BRANCH: ScopeRef = {
  id: "scp_01j9z3k4m5n6p7q8r9s0t1v2t2",
  path: "platform.acme.riyadh",
};

/** Runs an actor that claims `TREE_BRANCH` as `TREE_TOP`, as `CallIsolationDriver` does once the tree shows it. */
class TreeIsolation extends Driver(CallIsolation) {
  async run<T>(
    actor: Actor,
    _scope: ScopeRef | readonly ScopeRef[] | undefined,
    work: (actor?: Actor) => Promise<T>,
  ): Promise<T> {
    return work(
      actor.scopeId === TREE_BRANCH.id ? Object.freeze({ ...actor, scopeId: TREE_TOP }) : actor,
    );
  }
}

/** An action a person, a job or the system may run. */
class SweepAction extends Action({
  key: "order.sweep",
  actors: [ActorKind.User, ActorKind.Job, ActorKind.System],
}) {
  async handle(): Promise<string> {
    return "swept";
  }
}

describe("ActionPipeline tree tenant (STA-2561)", () => {
  const branchUser: Actor = {
    kind: ActorKind.User,
    id: "usr_7",
    realm: Realm.Customer,
    scopeId: TREE_BRANCH.id,
  };

  it("writes a branch user's approval under the tenant the isolation runs as, with the branch apart", async () => {
    const approvals = new Approvals();
    const bindings = new MemoryApprovalBindingStoreDriver();
    const { pipeline, access } = setup([
      [CallIsolation, new TreeIsolation()],
      [ApprovalGate, approvals],
      [ApprovalBindingStore, bindings],
      [ApprovedRefundAction, new ApprovedRefundAction()],
    ]);
    const refused = await pipeline
      .execute(ApprovedRefundAction, {}, { actor: branchUser, scope: TREE_BRANCH })
      .catch((error: unknown) => error);
    expect(refused).toMatchObject({ code: "approval_required" });
    const { approvalId } = refused as { approvalId: string };
    expect(access.calls[0]).toMatchObject({
      actor: branchUser,
      scopeId: TREE_TOP,
      branchScopeId: TREE_BRANCH.id,
      scope: TREE_BRANCH,
    });
    expect(await bindings.find(approvalId)).toMatchObject({
      scopeId: TREE_TOP,
      requester: branchUser,
    });
    expect(approvals.parked[0]).toMatchObject({ scopeId: TREE_TOP, scope: TREE_BRANCH });
  });

  it("hands a branch user's handler the tenant as ctx.scopeId", async () => {
    const { pipeline } = setup([[CallIsolation, new TreeIsolation()]]);
    const output = await pipeline.execute(
      InspectAction,
      {},
      { actor: branchUser, scope: TREE_BRANCH },
    );
    expect(output).toMatchObject({ scopeId: TREE_TOP, scope: TREE_BRANCH });
  });

  it("keeps a tenant-level user's, a job's and a system actor's tenant in both fields", async () => {
    const { pipeline, access } = setup([
      [CallIsolation, new TreeIsolation()],
      [SweepAction, new SweepAction()],
    ]);
    const topScope: ScopeRef = { id: TREE_TOP, path: "platform.acme" };
    const callers: Actor[] = [
      { kind: ActorKind.User, id: "usr_8", realm: Realm.Customer, scopeId: TREE_TOP },
      { kind: ActorKind.Job, id: "job_1", scopeId: TREE_TOP },
      { kind: ActorKind.System, id: "sys_1", scopeId: TREE_TOP },
    ];
    for (const actor of callers)
      await pipeline.execute(SweepAction, {}, { actor, scope: topScope });
    expect(access.calls.map((call) => [call.actor, call.scopeId, call.branchScopeId])).toEqual(
      callers.map((actor) => [actor, TREE_TOP, TREE_TOP]),
    );
  });

  it("gives a platform call neither field", async () => {
    const { pipeline, access } = setup([
      [CallIsolation, new TreeIsolation()],
      [SweepAction, new SweepAction()],
    ]);
    const staff: Actor = { kind: ActorKind.User, id: "usr_2", realm: Realm.Staff };
    await pipeline.execute(SweepAction, {}, { actor: staff });
    expect(access.calls[0]).not.toHaveProperty("scopeId");
    expect(access.calls[0]).not.toHaveProperty("branchScopeId");
  });

  it("keeps the branch as scopeId when no isolation is bound", async () => {
    const { pipeline, access } = setup([[SweepAction, new SweepAction()]]);
    await pipeline.execute(SweepAction, {}, { actor: branchUser, scope: TREE_BRANCH });
    expect(access.calls[0]).toMatchObject({
      scopeId: TREE_BRANCH.id,
      branchScopeId: TREE_BRANCH.id,
    });
  });
});

/** An action that answers which attempt of a job it runs as. */
class AttemptAction extends Action({
  key: "order.attempt",
  actors: [ActorKind.User, ActorKind.Job],
}) {
  async handle(_input: object, ctx: ActionContext): Promise<object> {
    return { attempt: ctx.attempt ?? null };
  }
}

describe("ActionPipeline job attempt (ctx.attempt)", () => {
  it("hands a queued job's attempt to the context, and none to a direct call", async () => {
    const { pipeline } = setup([[AttemptAction, new AttemptAction()]]);
    await expect(
      pipeline.execute(AttemptAction, {}, { actor: customer, attempt: { number: 3, last: true } }),
    ).resolves.toEqual({ attempt: { number: 3, last: true } });
    await expect(pipeline.execute(AttemptAction, {}, { actor: customer })).resolves.toEqual({
      attempt: null,
    });
  });
});

/** An action that holds its call's isolation past its transaction, as a stream or a long agent loop does. */
class StreamAction extends Action({
  key: "order.stream",
  actors: [ActorKind.User],
}) {
  /** Where the call's context is read, as a service below the action reads it. */
  readonly request: RequestContext;

  /** What `ctx.detach()` returned, held past the call. */
  held: DetachedCall | undefined;

  /** What `RequestContext.detached()` answered inside `handle`. */
  inside: DetachedCall | undefined;

  constructor(request: RequestContext) {
    super();
    this.request = request;
  }

  async handle(_input: object, ctx: ActionContext): Promise<string> {
    this.held = ctx.detach();
    this.inside = this.request.detached();
    return "streaming";
  }
}

describe("ActionPipeline detached call (ctx.detach)", () => {
  const scope: ScopeRef = { id: "scp_01j9z3k4m5n6p7q8r9s0t1v2w3", path: "platform.acme" };

  /** A pipeline with `StreamAction` over one storage, and the detached call its run left. */
  async function streamed(isolation?: CallIsolation, actor: Actor = customer, at = scope) {
    const storage = new AsyncContextStorageDriver();
    const request = new RequestContext(storage);
    const action = new StreamAction(request);
    const { pipeline } = setup([
      [ContextStorage, storage],
      [StreamAction, action],
      ...(isolation === undefined ? [] : [[CallIsolation, isolation] as const]),
    ]);
    await pipeline.execute(StreamAction, {}, { actor, scope: at });
    if (action.held === undefined) throw new Error("handle did not detach");
    return { detached: action.held, inside: action.inside, request };
  }

  it("runs each step after the call as a new writable isolation with the call's actor and scope", async () => {
    const isolation = new LoggingIsolation();
    const { detached } = await streamed(isolation);
    expect(isolation.runs).toEqual([["usr_1", scope, false]]);
    log = [];
    await expect(detached.isolated(async () => "step 1")).resolves.toBe("step 1");
    await expect(detached.isolated(async () => "step 2")).resolves.toBe("step 2");
    expect(isolation.runs.slice(1)).toEqual([
      ["usr_1", scope, false],
      ["usr_1", scope, false],
    ]);
    expect(log).toEqual([
      "isolation:write",
      "isolation:commit",
      "isolation:write",
      "isolation:commit",
    ]);
    expect(detached).toMatchObject({ actor: customer, scope });
    expect(Object.isFrozen(detached)).toBe(true);
  });

  it("rolls a step back when its work throws, and the next step still runs", async () => {
    const isolation = new LoggingIsolation();
    const { detached } = await streamed(isolation);
    log = [];
    await expect(
      detached.isolated(async () => {
        throw new Error("model down");
      }),
    ).rejects.toThrow("model down");
    await detached.isolated(async () => undefined);
    expect(log).toEqual([
      "isolation:write",
      "isolation:rollback",
      "isolation:write",
      "isolation:commit",
    ]);
  });

  it("answers RequestContext inside run and each step, and never inside the call's own transaction", async () => {
    const { detached, inside, request } = await streamed(new LoggingIsolation());
    expect(inside).toBeUndefined();
    expect(request.detached()).toBeUndefined();
    const seen = await detached.run(async () => {
      await Promise.resolve();
      const step = await detached.isolated(async () => [request.detached(), request.current().key]);
      return [request.detached(), ...step];
    });
    expect(seen).toEqual([detached, detached, "order.stream"]);
  });

  it("keeps a value another store holds around the loop readable inside each step", async () => {
    const { detached } = await streamed(new LoggingIsolation());
    const token = new AsyncLocalStorage<string>();
    const read = await token.run("held-caller-token", () =>
      detached.run(() => detached.isolated(async () => token.getStore())),
    );
    expect(read).toBe("held-caller-token");
  });

  it("runs a branch user's steps as the tenant the isolation settled", async () => {
    const branchUser: Actor = {
      kind: ActorKind.User,
      id: "usr_7",
      realm: Realm.Customer,
      scopeId: TREE_BRANCH.id,
    };
    const { detached, request } = await streamed(new TreeIsolation(), branchUser, TREE_BRANCH);
    expect(detached).toMatchObject({ actor: branchUser, scope: TREE_BRANCH });
    const scopeId = await detached.isolated(async () => request.current().scopeId);
    expect(scopeId).toBe(TREE_TOP);
  });

  it("enters each DETACHED_RUNS wrapper around run and a lone step, never again for a step inside run", async () => {
    const entered: string[] = [];
    const wrapper: DetachedRun = async (step, work) => {
      entered.push("enter");
      expect(typeof step).toBe("function");
      return work();
    };
    DETACHED_RUNS.add(wrapper);
    try {
      const { detached } = await streamed(new LoggingIsolation());
      await detached.run(() => detached.isolated(async () => undefined));
      expect(entered).toEqual(["enter"]);
      await detached.isolated(async () => undefined);
      expect(entered).toEqual(["enter", "enter"]);
    } finally {
      DETACHED_RUNS.delete(wrapper);
    }
  });

  it("runs a step as it is when no isolation is bound", async () => {
    const { detached } = await streamed();
    log = [];
    await expect(detached.isolated(async () => "plain")).resolves.toBe("plain");
    expect(log).toEqual([]);
  });
});
