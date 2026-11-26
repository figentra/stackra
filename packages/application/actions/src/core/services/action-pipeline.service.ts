/**
 * Stackra file contract:
 * Purpose: `ActionPipeline`, the one way an action or query runs: the fixed steps of ADR 0138 in their order (tenancy
 *          with the live-configuration guard of a structural action, permission, precondition, entitlement, flag,
 *          approval, idempotency, rate limit, interceptors, `handle` with its meter's usage event), the call
 *          context (with the call's scope, so `ctx.scope` and every port read it), the action's unit of work with
 *          `afterCommit`, the audit entry, and the idempotent replay; for offline clients, a device's replayed calls
 *          in sequence order, the `offline.cap` reconciliation, the review of offline-computed documents (`accepts`),
 *          the verified device (`ctx.deviceId`) and a replica query's answer (`ctx.replica`, by the input's `cursor`);
 *          and `propose`, an action's draft-only run (the steps up to validation, then a metered draft, no effects).
 *          The permission step includes an action's step-up (`stepUp`, through `StepUpCheck`, asked of a user caller
 *          only), and the call context
 *          carries the caller's verified assurance (`ctx.assurance`), the sandbox flag (`ctx.sandbox`, also on the
 *          descriptor) and the network client (`ctx.client`, never on the descriptor or the audit entry; STA-1248),
 *          the request origin (`ctx.origin`, also on the descriptor, so the audit entry carries it) and an action's
 *          integration event without a model (`ctx.publish`, through the outbox in its unit of work; ADR 0456), and
 *          the visitor's consent (`ctx.consent()`: the call's signed snapshot verified once through `ConsentCheck`;
 *          ADR 0472), and a `reads: "replica"` query's `handle` on a replica outside the caller's read-your-writes
 *          window (`ReplicaReads`, opened by each committed action), and a call's `analytics` event
 *          (`analytics.tracked`, through the outbox when its consent grants `analytics`). Every call and proposal runs in one `Tracer` span when a tracer is bound, named
 *          `<kind> <key>` and carrying the ADR 0147 attribute names (ids and codes only, never input or output). `handle` runs inside
 *          `QueryBudget` when one is bound (the call's statements counted against its `queryBudget`), and `ctx.memo`
 *          keeps one answer per key for the call. `ctx.detach()` holds the call's isolation past its transaction: each
 *          `isolated` step of a stream or loop is a new `CallIsolation` transaction with the descriptor's actor and
 *          scope. Order (ADR 0138 as amended by ADR 0495): the tenancy check and the
 *          live-configuration guard run first; then, when a `CallIsolation` is bound, everything after them (permission,
 *          approval, idempotency, rate limit, interceptors, the unit of work and `handle`) runs inside it, in one
 *          transaction whose scope and tenant settings are transaction-local and from the verified actor (an action
 *          writable, a query read-only); the descriptor's and the context's `scopeId` are then the tenant the isolation
 *          runs as (a branch user's parent tenant), so every tenant-labelled write, the rate-limit and idempotency keys
 *          among them, is per tenant, and the branch stays on `descriptor.branchScopeId`. The action's unit of work is then a savepoint of that transaction (the default
 *          propagation: its `timeout` and its rollback hold, and it is not `requiresNew`), so a call commits once, when
 *          the isolation transaction ends. What waits for that commit runs after it: the idempotency `complete`, the
 *          offline cap record, the read-your-writes mark and `ctx.afterCommit` work. The audit's refusal entries and a
 *          query's analytics event are written outside it, and with none bound a call runs as before. An action that
 *          declares `credentials: "ignore"` runs a signed-in caller's call as a fresh anonymous actor, its request
 *          stripped of what the credential gave, before the descriptor and context are built.
 * Boundary: built by the runtime (and the testing module) over a `Resolver`, so it reads the action instances, their
 *           preconditions and interceptors and every step's port by class. Steps whose owner is not installed are
 *           skipped (tenancy, entitlement, flag, limit reservation, unit of work, audit); permission fails closed (no
 *           `AccessControl` is an error, never an allowed call); approval runs only when an `ApprovalGate` is bound,
 *           except that an action declaring `approval: true` fails closed without one (ADR 0397 as amended); a declared rate limit, Idempotency-Key, device order,
 *           offline cap, `accepts`, replica, `structural`, `meter` or `stepUp` with no port bound is an error. The approval gate
 *           sees the validated input; a metered action's usage event and a successful call's audit entry are written
 *           in its unit of work, after `handle`, and the unit of work runs inside the `LimitReservation` (reserve, then
 *           commit). Nothing reorders the steps: device order wraps them all (like the audit, whose refusal and replay
 *           entries are written outside), so a call refused by any step still settles its sequence; a call from a
 *           device a bound `DeviceStatusReader` reports revoked is refused before device order and settles nothing (no
 *           reader bound, no check); the cap is part
 *           of the idempotency step and the review part of `handle`. A device's sequences are strictly increasing, not contiguous: one above
 *           the last settled is applied (the client sends one call at a time, so it is the next), one at or below may
 *           only replay its stored output. Only a Refusal is a refusal; any other error is a bug and propagates. A
 *           query that declares `cache` answers from the `Cache` port inside its interceptors (the cache step runs only
 *           when a `Cache` is bound).
 * Runtime: isomorphic
 * Governing contract: ADR 0138 (as amended by 0294: the order is fixed); ADR 0136 (decisions 1 to 3 and 5); ADR 0305
 *                     (rule 24: interceptors); ADR 0217 (decision 2: limits enforced in the pipeline); ADR 0098; ADR
 *                     0327 (decision 6: the current scope in the call context); ADR 0338 (decisions 1, 3 and 5); ADR
 *                     0337 (decisions 4 and 5); ADR 0098 (decision 3: approval); ADR 0359 (decision 3: live is
 *                     read-only); ADR 0216 (decisions 1 and 4: usage through the outbox); ADR 0212 (decision 4: the
 *                     audit in the unit of work); ADR 0215 and owner round 3 item 18 (reserve-then-commit); STA-813
 *                     (an unbound approval step does not run); ADR 0406
 *                     (step-up assurance); STA-1277 (the area bucket sized by `RateLimitBudget`, a value entitlement);
 *                     STA-1588 (the default action buckets); ADR 0213 (decision 2: a scope's rate-limit caps, through
 *                     `RateLimitCapSource`, are settings);
 *                     ADR 0456 (decisions 1 and 2: the request origin, an integration event without a model); STA-1380
 *                     (event ids from @stackra/contracts' `mintPublicId`); STA-1477 (the (app, scope) area key, the
 *                     refusal's back-off details, the `rate_limited` usage event); ADR 0305 (rule 31, as amended
 *                     2026-10-28: the query cache step, STA-1445); ADR 0472 (decision 3: `ctx.consent`, no new step,
 *                     never a refusal by itself); ADR 0147 (decision 3: the span attributes, no values) and ADR 0184
 *                     (decision 1: OpenTelemetry), STA-1513; ADR 0057 (decision 6: read replica), STA-1504; ADR 0216
 *                     (decision 1: analytics is its own stream), STA-1512; data-layer gaps scale-performance 8 and
 *                     caching 13 (STA-1400: `QueryBudget` around `handle`, `ctx.memo`).
 */
import { Cache } from "@stackra/cache/contracts";
import { kindOf, type AnyClass } from "@stackra/container";
import {
  actingScopeId,
  type Actor,
  ActorKind,
  type ApiArea,
  ApprovalSettingsSource,
  AssuranceLevel,
  Clock,
  Duration,
  IdempotencyRetentionSource,
  IdentityResolver,
  type Json,
  Logger,
  MeterKind,
  mintPublicId,
  RateLimitCapSource,
  type TraceAttributes,
  Tracer,
} from "@stackra/contracts";
import {
  ForbiddenError,
  IdempotencyKeyInProgressError,
  IdempotencyKeyReusedError,
  isRefusal,
  RateLimitedError,
  refusalFromStored,
  storedRefusal,
} from "@stackra/errors";
import type { Event } from "@stackra/events";
import { EventOutbox } from "@stackra/events/contracts";
import { duration, schemaOf, validate } from "@stackra/validation";

import { RateLimitConfig } from "#config/rate-limit.config";
import { ApprovalExecution } from "#contracts/enums/approval-execution.enum";
import { CallOriginKind } from "#contracts/enums/call-origin-kind.enum";
import { ConsentRefusal } from "#contracts/enums/consent-refusal.enum";
import { ReviewReason } from "#contracts/enums/review-reason.enum";
import { AccessControl } from "#contracts/ports/access-control.port";
import { ActorStatusCheck } from "#contracts/ports/actor-status-check.port";
import { ApprovalBindingStore } from "#contracts/ports/approval-binding-store.port";
import { ApprovalGate } from "#contracts/ports/approval-gate.port";
import { AuditTrail } from "#contracts/ports/audit-trail.port";
import { DETACHED_RUNS } from "#contracts/constants/detached-runs.constant";
import { CallIsolation } from "#contracts/ports/call-isolation.port";
import { ConsentCheck } from "#contracts/ports/consent-check.port";
import { ContextStorage } from "#contracts/ports/context-storage.port";
import { DeviceSequenceStore } from "#contracts/ports/device-sequence-store.port";
import { DeviceStatusReader } from "#contracts/ports/device-status-reader.port";
import { EntitlementCheck } from "#contracts/ports/entitlement-check.port";
import { FlagCheck } from "#contracts/ports/flag-check.port";
import { IdempotencyStore } from "#contracts/ports/idempotency-store.port";
import { JobDispatcher } from "#contracts/ports/job-dispatcher.port";
import { LimitReservation } from "#contracts/ports/limit-reservation.port";
import { LiveConfigurationGuard } from "#contracts/ports/live-configuration-guard.port";
import { OfflineCapStore } from "#contracts/ports/offline-cap-store.port";
import { QueryBudget } from "#contracts/ports/query-budget.port";
import { RateLimitBudget } from "#contracts/ports/rate-limit-budget.port";
import { RateLimitStore } from "#contracts/ports/rate-limit-store.port";
import { ReplicaLog } from "#contracts/ports/replica-log.port";
import { ReplicaReads } from "#contracts/ports/replica-reads.port";
import { ReviewItemSink } from "#contracts/ports/review-item-sink.port";
import { StepUpCheck } from "#contracts/ports/step-up-check.port";
import { TenancyCheck } from "#contracts/ports/tenancy-check.port";
import { UnitOfWork } from "#contracts/ports/unit-of-work.port";
import { WorkflowRunner } from "#contracts/ports/workflow-runner.port";
import type { ApprovalBinding } from "#contracts/types/approval-binding.type";
import type { DetachedStep } from "#contracts/types/detached-step.type";
import type { ApprovalDraft } from "#contracts/types/approval-draft.type";
import type { ApprovalRequirement } from "#contracts/types/approval-requirement.type";
import type { AuditEntry } from "#contracts/types/audit-entry.type";
import type { CallConsent } from "#contracts/types/call-consent.type";
import type { CallDescriptor } from "#contracts/types/call-descriptor.type";
import type { CallPublic } from "#contracts/types/call-public.type";
import type { RateLimitBucket } from "#contracts/types/rate-limit-bucket.type";
import type { ReplicaRow } from "#contracts/types/replica-row.type";
import type { Action } from "#core/bases/action.base";
import type { ApprovalCondition } from "#core/bases/approval-condition.base";
import type { Interceptor } from "#core/bases/interceptor.base";
import type { Precondition } from "#core/bases/precondition.base";
import type { Query } from "#core/bases/query.base";
import { ACTION_CALLED_EVENT } from "#core/constants/action-called-event.constant";
import { ACTION_REGISTRY } from "#core/constants/action-registry.constant";
import { AFTER_COMMIT_FAILED } from "#core/constants/after-commit-failed.constant";
import { APPROVAL_PARK_FAILED } from "#core/constants/approval-park-failed.constant";
import { ANALYTICS_CONSENT_CATEGORY } from "#core/constants/analytics-consent-category.constant";
import { ANALYTICS_SKIPPED } from "#core/constants/analytics-skipped.constant";
import { CALL_DEFAULTS } from "#core/constants/call-defaults.constant";
import { DETACHED_CALLS } from "#core/constants/detached-calls.constant";
import { IDEMPOTENCY_TTL } from "#core/constants/idempotency-ttl.constant";
import { PROPOSAL_METER } from "#core/constants/proposal-meter.constant";
import { RATE_LIMITED_METER } from "#core/constants/rate-limited-meter.constant";
import { SHARED_CACHE_CONTEXT } from "#core/constants/shared-cache-context.constant";
import { OpenApprovalGateDriver } from "#core/drivers/open-approval-gate.driver";
import { CacheScope } from "#core/enums/cache-scope.enum";
import { Idempotency } from "#core/enums/idempotency.enum";
import { ApprovalRequiredError } from "#core/errors/approval-required.error";
import { ApprovalSettingsUnavailableError } from "#core/errors/approval-settings-unavailable.error";
import { DeviceRevokedError } from "#core/errors/device-revoked.error";
import { DeviceSequenceOutOfOrderError } from "#core/errors/device-sequence-out-of-order.error";
import { IdempotencyKeyRequiredError } from "#core/errors/idempotency-key-required.error";
import { IdempotencyStoreNotTransactionalError } from "#core/errors/idempotency-store-not-transactional.error";
import { InputInvalidError } from "#core/errors/input-invalid.error";
import { OfflineCapReachedError } from "#core/errors/offline-cap-reached.error";
import { AnalyticsTracked } from "#core/events/analytics-tracked.event";
import { UsageRecorded } from "#core/events/usage-recorded.event";
import { publicOf } from "#core/functions/public-of.function";
import { fingerprintOf } from "#core/functions/fingerprint-of.function";
import { isOlderRuleVersion } from "#core/functions/is-older-rule-version.function";
import { keptOutput } from "#core/functions/kept-output.function";
import { limitedSettingsReader } from "#core/functions/limited-settings-reader.function";
import { mergeApprovalRequirements } from "#core/functions/merge-approval-requirements.function";
import { periodOf } from "#core/functions/period-of.function";
import { queryCacheKey } from "#core/functions/query-cache-key.function";
import { startOfZonedDay } from "#core/functions/start-of-zoned-day.function";
import { verifyApproval } from "#core/functions/verify-approval.function";
import { ReplicaFeed } from "#core/services/replica-feed.service";
import type { ActionPublic } from "#core/types/action-public.type";
import type { ActionAccepts } from "#core/types/action-accepts.type";
import type { ActionApproval } from "#core/types/action-approval.type";
import type { ApprovalSettingsReader } from "#core/types/approval-settings-reader.type";
import type { ActionContext } from "#core/types/action-context.type";
import type { ActionDraft } from "#core/types/action-draft.type";
import type { ActionEffects } from "#core/types/action-effects.type";
import type { ActionMeter } from "#core/types/action-meter.type";
import type { ActionRateLimit } from "#core/types/action-rate-limit.type";
import type { ActionRegistration } from "#core/types/action-registration.type";
import type { CallAnalytics } from "#core/types/call-analytics.type";
import type { CallInput } from "#core/types/call-input.type";
import type { CallOptions } from "#core/types/call-options.type";
import type { DetachedCall } from "#core/types/detached-call.type";
import type { OfflineOptions } from "#core/types/offline-options.type";
import type { OutputOf } from "#core/types/output-of.type";
import type { PeriodInput } from "#core/types/period-input.type";
import type { QueryCache } from "#core/types/query-cache.type";
import type { QueryContext } from "#core/types/query-context.type";
import type { ReplicaBounds } from "#core/types/replica-bounds.type";
import type { Resolver } from "#core/types/resolver.type";

/** The recorded options the pipeline reads, with the defaults `Action` and `Query` applied. */
interface Recorded {
  readonly key: string;
  readonly actors: readonly ActorKind[];
  readonly area: ApiArea;
  readonly interceptors: readonly AnyClass<Interceptor>[];
  readonly preconditions?: readonly AnyClass<Precondition>[];
  readonly idempotency?: Idempotency;
  readonly idempotencyTtl?: Duration;
  readonly rateLimit?: ActionRateLimit;
  readonly offline?: OfflineOptions;
  readonly accepts?: ActionAccepts;
  readonly structural?: boolean;
  readonly meter?: ActionMeter;
  readonly effects?: ActionEffects;
  readonly approval?: boolean | ActionApproval;
  readonly stepUp?: AssuranceLevel;
  readonly public?: ActionPublic;
  readonly stream?: boolean;
  readonly timeout?: Duration;
  readonly cache?: QueryCache;
  readonly reads?: "primary" | "replica";
  readonly analytics?: CallAnalytics;
  readonly queryBudget?: number;
  readonly credentials?: "ignore";
}

/**
 * What a `credentials: "ignore"` call keeps of its request: nothing that comes from the caller's credential (the actor,
 * scope, assurance, device, approval or read-your-writes mark). An allowlist, so a field added later is dropped.
 */
const UNCREDENTIALED: readonly (keyof CallOptions)[] = [
  "idempotencyKey",
  "locale",
  "timeZone",
  "currency",
  "market",
  "callId",
  "abortSignal",
  "sandbox",
  "client",
  "expectedVersion",
  "consentSnapshot",
];

/** What one call accumulates while it runs. */
interface CallState {
  idempotencyKey: string | undefined;
  /** Set when the call started inside a transaction already running, so it does not own its commit. */
  joined: boolean;
  /** Set when a device resends a sequence at or below its last settled one: only a replay may answer; that last one. */
  replayOnly: number | undefined;
  /** A replica query's change cursor: the validated input's `cursor`. */
  replicaCursor: string | undefined;
  readonly afterCommit: (() => unknown)[];
  readonly audit: Record<string, Json>;
  /** Set once the success entry was written inside the unit of work, so the outer audit does not write it again. */
  audited: boolean;
  /** Set once the call's analytics event was written inside the unit of work, so the outer step does not write it. */
  tracked: boolean;
  /** Set when a refused call's `rate_limited` usage event is still to be written, after its isolation transaction ends. */
  unmetered: boolean;
  /** When the call started, by `performance.now()`, for the generic analytics event's duration. */
  readonly startedMs: number;
  /** `ctx.memo`'s answers by key, kept for the call only. */
  readonly memo: Map<string, Promise<unknown>>;
  /** Set when the approval stage refused the call and its request is still to be written, after the transaction ends. */
  parking: { readonly binding: ApprovalBinding; readonly draft: ApprovalDraft } | undefined;
}

/** Everything one call carries through the steps. */
interface Call {
  readonly type: AnyClass<Action | Query>;
  readonly kind: "action" | "query";
  readonly options: Recorded;
  readonly registration: ActionRegistration | undefined;
  /** Replaced once, with the tenant the isolation runs as, when that is not the actor's own claim (`isolated`). */
  descriptor: CallDescriptor;
  readonly request: CallOptions;
  readonly at: Date;
  readonly state: CallState;
  /** Replaced with `descriptor`. */
  ctx: QueryContext | ActionContext;
}

/** An instance whose `handle` the pipeline calls. */
type Handler = { handle: (input: unknown, ctx: unknown) => Promise<unknown> };

const IAM = "bind an AccessControl driver (@stackra/iam); calls fail closed without one";

const APPROVALS =
  "declares approval: true, so bind an ApprovalGate driver (the OS tasks-approvals service); it fails closed without one";

/** The descriptor's `public` field, when the operation is public. */
function publicField(open: CallPublic | undefined): { readonly public?: CallPublic } {
  return open === undefined ? {} : { public: open };
}

/**
 * Whether an `api_client` call may reach this operation at all: it is `public`, the call carries a key, and a
 * publishable key calls a write only when the operation opts in (a read admits one unless it opts out).
 */
function keyMayCall(
  descriptor: CallDescriptor,
  options: { readonly public?: ActionPublic },
  kind: "action" | "query",
): boolean {
  const open = options.public;
  const key = descriptor.credential;
  if (open === undefined || key === undefined) return false;
  if (!key.publishable) return true;
  const allowed = open === true ? undefined : open.publishable;
  return allowed ?? kind === "query";
}

/**
 * Runs actions and queries.
 *
 * @example
 * const pipeline = new ActionPipeline(container);
 * const output = await pipeline.execute(CreateOrderAction, input, { actor, idempotencyKey: "k1", locale: "ar-SA" });
 */
// oxlint-disable-next-line stackra/base-matches-suffix -- reason: built per resolver by the runtime and the testing module, never a container service
export class ActionPipeline {
  /** Where action instances and step ports come from. */
  private readonly resolver: Resolver;

  /**
   * @param resolver - the booted container, a request container or a testing app.
   */
  constructor(resolver: Resolver) {
    this.resolver = resolver;
  }

  /**
   * Runs one call of `type` with `input` through every step and resolves to its output (a replayed output for a
   * repeated Idempotency-Key).
   *
   * @throws Refusal from any step or from `handle`: the call's refusal.
   * @throws TypeError when `type` is not an action or a query; Error when a required port is not bound.
   */
  async execute<C extends AnyClass<Action | Query>>(
    type: C,
    input: CallInput<InstanceType<C>>,
    request: CallOptions,
  ): Promise<OutputOf<InstanceType<C>>> {
    const call = this.prepare(type, this.keyed(request));
    const work = () =>
      this.traced(call, call.kind, () =>
        this.audited(call, () =>
          this.analyzed(call, () => this.ordered(call, () => this.steps(call, input))),
        ),
      );
    const storage = this.optional(ContextStorage);
    return (await (storage === undefined ? work() : storage.run(call.ctx, work))) as OutputOf<
      InstanceType<C>
    >;
  }

  /**
   * Proposes one call of the action `type` with `input`: runs the steps up to and including input validation
   * (tenancy, permission, preconditions, entitlement, flag), writes one usage event on `PROPOSAL_METER`, and resolves
   * to the draft. Approval, idempotency, the rate limit, interceptors and `handle` never run, so nothing else is
   * written and no effect happens: the suggest mode of an agent (R3-SO-02).
   *
   * @throws Refusal from any step it runs.
   * @throws TypeError when `type` is not an action; Error when a required port (the outbox included) is not bound.
   */
  async propose<C extends AnyClass<Action>>(
    type: C,
    input: CallInput<InstanceType<C>>,
    request: CallOptions,
  ): Promise<ActionDraft> {
    const call = this.prepare(type, request);
    if (call.kind !== "action")
      throw new TypeError(`${type.name} is a query: only an action is proposed`);
    const draft = async (): Promise<ActionDraft> => {
      await this.checkedTenancy(call);
      // writable: the proposal's usage event is a write
      const checked = await this.isolated(call, async () => {
        const validated = await this.checked(call, input);
        await this.metered(call, { name: PROPOSAL_METER, kind: MeterKind.Count }, validated);
        return validated;
      });
      return Object.freeze({
        key: call.descriptor.key,
        callId: call.descriptor.callId,
        input: checked,
        proposedAt: call.at,
      });
    };
    const work = (): Promise<ActionDraft> => this.traced(call, "propose", draft);
    const storage = this.optional(ContextStorage);
    return storage === undefined ? work() : storage.run(call.ctx, work);
  }

  /**
   * Runs `work` in one `Tracer` span named `<verb> <key>` when a tracer is bound (ADR 0147 decision 3): the call's
   * ids as attributes, then its `outcome` (`ok`, `refused` with the refusal's `code`, or `error`) and `latencyMs`.
   * Only an error that is not a Refusal fails the span: a refusal is an answer, not a fault. No attribute carries
   * input, output or a person's data.
   */
  private traced<T>(call: Call, verb: string, work: () => Promise<T>): Promise<T> {
    const tracer = this.optional(Tracer);
    if (tracer === undefined) return work();
    const { descriptor } = call;
    const attributes: TraceAttributes = {
      action: descriptor.key,
      correlationId: descriptor.callId,
      actorType: descriptor.actor.kind,
      actorId: descriptor.actor.id,
      ...(descriptor.scope === undefined ? {} : { scopeId: descriptor.scope.id }),
      ...(descriptor.origin === undefined ? {} : { origin: descriptor.origin.kind }),
    };
    return tracer.span(`${verb} ${descriptor.key}`, attributes, async (span) => {
      const started = globalThis.performance.now();
      const latency = () => Math.round(globalThis.performance.now() - started);
      try {
        const output = await work();
        span.set({ outcome: "ok", latencyMs: latency() });
        return output;
      } catch (error) {
        if (isRefusal(error))
          span.set({ outcome: "refused", code: error.code, latencyMs: latency() });
        else {
          span.set({ outcome: "error", latencyMs: latency() });
          span.fail(error);
        }
        throw error;
      }
    });
  }

  /** The call `type` makes under `request`: its options, identity, descriptor, state and context. */
  private prepare(type: AnyClass<Action | Query>, given: CallOptions): Call {
    const record = kindOf(type);
    if (record?.kind !== "action" && record?.kind !== "query")
      throw new TypeError(
        `${type.name} is not an action or a query: extend Action({...}) or Query({...})`,
      );
    const options = record.options as unknown as Recorded;
    const request = options.credentials === "ignore" ? this.uncredentialed(given) : given;
    const registration = ACTION_REGISTRY.get(type);
    const at = this.optional(Clock)?.now() ?? new Date();
    const { actor } = request;
    // an agent with no tenant of its own acts in its human's (ADR 0360); a branch until the isolation names its tenant
    const scopeId = actingScopeId(actor);
    const descriptor: CallDescriptor = Object.freeze({
      callId: request.callId ?? globalThis.crypto.randomUUID(),
      type,
      kind: record.kind,
      key: registration?.key ?? options.key,
      ...(registration?.permission === undefined ? {} : { permission: registration.permission }),
      ...(registration?.risk === undefined ? {} : { risk: registration.risk }),
      ...((registration?.effects ?? options.effects) === undefined
        ? {}
        : { effects: Object.freeze([...(registration?.effects ?? options.effects ?? [])]) }),
      actor,
      ...(scopeId === undefined ? {} : { scopeId, branchScopeId: scopeId }),
      ...(request.scope === undefined ? {} : { scope: request.scope }),
      area: options.area,
      ...(request.sandbox === true ? { sandbox: true as const } : {}),
      ...(request.origin === undefined ? {} : { origin: Object.freeze({ ...request.origin }) }),
      ...(request.credential === undefined
        ? {}
        : { credential: Object.freeze({ ...request.credential }) }),
      ...publicField(publicOf(options, registration?.permission, registration?.risk)),
      ...(options.stream === true ? { stream: true as const } : {}),
    });
    const state: CallState = {
      idempotencyKey: undefined,
      joined: false,
      replayOnly: undefined,
      replicaCursor: undefined,
      afterCommit: [],
      audit: {},
      audited: false,
      tracked: false,
      unmetered: false,
      startedMs: globalThis.performance.now(),
      memo: new Map(),
      parking: undefined,
    };
    const ctx = this.contextOf(descriptor, request, at, state);
    return { type, kind: record.kind, options, registration, descriptor, request, at, state, ctx };
  }

  /**
   * The steps, in the fixed order: the tenancy check, then (inside `CallIsolation` when bound) permission to `handle`,
   * then what waits for the isolation transaction's commit.
   */
  private async steps(call: Call, raw: unknown): Promise<unknown> {
    const { kind } = call;
    await this.checkedTenancy(call);
    // read before the isolation opens its own: a call that joined a running transaction does not own the commit
    call.state.joined = kind === "action" && (this.optional(UnitOfWork)?.inTransaction() ?? false);
    type Claim = Awaited<ReturnType<ActionPipeline["claim"]>>;
    // set inside the isolated work, read after it: a holder, so the closure's writes are not narrowed away
    const taken: { claim: Claim; amount: number | undefined } = {
      claim: undefined,
      amount: undefined,
    };
    let output: unknown;
    try {
      output = await this.isolated(call, async () => {
        const input = await this.checked(call, raw);
        if (kind === "action") await this.approved(call, input);
        taken.claim = kind === "action" ? await this.claim(call, input) : undefined;
        if (taken.claim !== undefined && "replay" in taken.claim) return taken.claim.replay;
        if (call.state.replayOnly !== undefined)
          throw DeviceSequenceOutOfOrderError.create({ acknowledged: call.state.replayOnly });
        taken.amount = await this.capped(call, input);
        await this.limit(call);
        return this.intercepted(call, input);
      });
    } catch (error) {
      if (taken.claim !== undefined && "held" in taken.claim) {
        const store = this.required(IdempotencyStore, "");
        const { held, fingerprint, ttl, sent } = taken.claim;
        // a refusal that retrying cannot change is the call's answer; it is written after the rollback, which
        // took the claim row with it (a joined store). Anything else frees the key for a retry.
        // only a key the caller sent: an input-derived key would replay the refusal to every later identical call
        if (sent && isRefusal(error) && !error.retryable)
          await store.completeRefused(held, fingerprint, storedRefusal(error), ttl);
        else await store.release(held);
      }
      // a parked request is a write the refusal's rollback would undo, so it is written after the transaction ends
      const failure = call.state.parking === undefined ? error : await this.parked(call, error);
      // a refused call's usage event is a write its rollback would undo, so it waits for the transaction to end
      if (call.state.unmetered)
        await this.metered(call, { name: RATE_LIMITED_METER, kind: MeterKind.Count }, undefined);
      throw failure;
    }
    const { claim, amount } = taken;
    if (claim !== undefined && "replay" in claim) return output;
    try {
      if (kind === "action")
        await this.optional(ReplicaReads)?.wrote(this.writerOf(call.descriptor), call.at);
      if (claim !== undefined)
        await this.required(IdempotencyStore, "").complete(
          claim.held,
          keptOutput(call.registration?.output, output),
        );
      if (amount !== undefined && call.request.device?.sequence !== undefined)
        await this.required(OfflineCapStore, "").record(
          call.request.device.deviceId,
          call.descriptor.key,
          call.at,
          amount,
        );
      await this.afterCommit(call);
      return output;
    } catch (error) {
      if (claim !== undefined) await this.required(IdempotencyStore, "").release(claim.held);
      throw error;
    }
  }

  /** The tenancy step: the `TenancyCheck`, then the live-configuration guard of a structural action. */
  private async checkedTenancy(call: Call): Promise<void> {
    const { descriptor, options, kind } = call;
    await this.optional(TenancyCheck)?.check(descriptor);
    if (kind === "action" && options.structural === true)
      await this.required(
        LiveConfigurationGuard,
        `${descriptor.key} changes structural configuration; bind a guard (@stackra/tenancy)`,
      ).check(descriptor);
  }

  /**
   * Runs `work` in the call's `CallIsolation` transaction, built from the verified actor and the call's scope (a
   * query read-only, an action and a proposal writable); with none bound it runs as it is. When the isolation runs as
   * another tenant than the actor claims (a branch's parent tenant), the call's descriptor and context take that tenant
   * as `scopeId` first, so what the call writes carries the tenant the isolation set.
   */
  private isolated<T>(call: Call, work: () => Promise<T>): Promise<T> {
    const isolation = this.optional(CallIsolation);
    if (isolation === undefined) return work();
    const { actor, scope } = call.descriptor;
    // an isolation that hands no actor (a test stand-in) leaves the call as it was built
    const settled = (runAs?: Actor): Promise<T> => {
      const scopeId = runAs === undefined ? undefined : actingScopeId(runAs);
      if (scopeId === undefined || scopeId === call.descriptor.scopeId) return work();
      call.descriptor = Object.freeze({ ...call.descriptor, scopeId });
      call.ctx = this.contextOf(call.descriptor, call.request, call.at, call.state);
      const storage = this.optional(ContextStorage);
      return storage === undefined ? work() : storage.run(call.ctx, work);
    };
    return isolation.run(actor, scope, settled, { readOnly: call.kind === "query" });
  }

  /**
   * The approval step of an action (ADR 0509). A call naming an approval id is verified against the owning service's
   * binding and the store's request (`verifyApproval`) and runs when it passes. Otherwise the declared requirement (when
   * the action's condition says so) and the gate's decision are merged, the larger wins, and a call that needs approval
   * is refused with its request still to be written after the isolation transaction (`parked`). With no gate bound the
   * step does not run, except for an action that declares `approval`, which fails closed.
   */
  private async approved(call: Call, input: unknown): Promise<void> {
    const { descriptor, options } = call;
    const gate = this.optional(ApprovalGate);
    const declaration = typeof options.approval === "object" ? options.approval : undefined;
    if (gate === undefined) {
      if (options.approval !== undefined && options.approval !== false)
        throw new Error(`ApprovalGate is not bound: ${descriptor.key} ${APPROVALS}`);
      return;
    }
    if (declaration !== undefined) {
      if (gate instanceof OpenApprovalGateDriver)
        throw new Error(
          `${descriptor.key} declares an approval stage, which OpenApprovalGateDriver cannot park`,
        );
      this.stageParts(descriptor.key);
    }
    const { approvalId } = call.request;
    if (approvalId !== undefined) return this.verified(call, gate, input, approvalId);
    const declared = await this.declared(call, declaration, input);
    const decided = await gate.decide(descriptor, input, declared);
    const merged = mergeApprovalRequirements(declared, decided);
    if (merged === undefined) return;
    // the approver's step-up floor: an action's own `stepUp`, and every L3 or L4 action, whatever the tenant's rule says
    const floor =
      (typeof options.stepUp === "string" ? options.stepUp : undefined) ??
      (descriptor.risk === "L3" || descriptor.risk === "L4" ? AssuranceLevel.Aal2 : undefined);
    const need =
      floor === undefined
        ? merged
        : (mergeApprovalRequirements(merged, {
            approvals: merged.approvals,
            expiresAfter: merged.expiresAfter,
            approverLevel: floor,
          }) ?? merged);
    // an agent's chain must end at a person who can be held to a vote (S8)
    let root = descriptor.actor;
    while (root.onBehalfOf !== undefined) root = root.onBehalfOf;
    if (root.kind !== ActorKind.User) throw ForbiddenError.create();
    const id = mintPublicId("apr", call.at.getTime());
    const inputHash = await fingerprintOf(descriptor.key, input);
    const expiresAt = new Date(
      call.at.getTime() + Duration.toMilliseconds(duration(need.expiresAfter)),
    );
    const execute =
      declared === undefined ? ApprovalExecution.OnResubmit : ApprovalExecution.OnGrant;
    const { scopeId } = descriptor;
    if (scopeId === undefined) throw ForbiddenError.create();
    call.state.parking = {
      binding: {
        approvalId: id,
        scopeId,
        ...(descriptor.scope === undefined ? {} : { scope: descriptor.scope }),
        requester: descriptor.actor,
        key: descriptor.key,
        inputHash,
        ...(call.request.assurance === undefined ? {} : { assurance: call.request.assurance }),
        requestedAt: call.at,
        expiresAt,
        approvals: need.approvals,
        ...(need.permission === undefined ? {} : { permission: need.permission }),
        ...(need.approverLevel === undefined ? {} : { approverLevel: need.approverLevel }),
        confirm: need.confirm === true,
        execute,
      },
      draft: {
        approvalId: id,
        key: descriptor.key,
        scopeId,
        ...(descriptor.scope === undefined ? {} : { scope: descriptor.scope }),
        requester: descriptor.actor,
        snapshot: input,
        requirement: need,
        expiresAt,
        execute,
      },
    };
    call.state.audit.approvalId = id;
    call.state.audit.inputHash = inputHash;
    throw ApprovalRequiredError.create({
      approvalId: id,
      approvalsRequired: need.approvals,
      expiresAt: expiresAt.toISOString(),
    });
  }

  /** The ports the approval stage cannot run without: a declared stage with any unbound fails closed (EC-007). */
  private stageParts(key: string) {
    const hint = `${key} declares an approval stage, which fails closed without it`;
    return {
      bindings: this.required(ApprovalBindingStore, hint),
      actors: this.required(ActorStatusCheck, hint),
      identity: this.required(IdentityResolver, hint),
    };
  }

  /** The requirement the action declared when its condition says this call needs it, else `undefined`. */
  private async declared(
    call: Call,
    declaration: ActionApproval | undefined,
    input: unknown,
  ): Promise<ApprovalRequirement | undefined> {
    if (declaration === undefined) return undefined;
    if (
      declaration.when !== undefined &&
      !(await this.resolver
        .get(declaration.when)
        .needed(input as never, call.ctx as ActionContext, this.settingsFor(declaration.when)))
    )
      return undefined;
    // shortcut: a Permissions static is its string until @stackra/iam ships the kind; read its name then.
    return {
      approvals: declaration.approvals ?? 1,
      permission: String(declaration.permission),
      expiresAfter: declaration.expiresAfter ?? "72h",
    };
  }

  /** The reader a condition receives: limited to its static `reads`, over the bound settings source (read lazily). */
  private settingsFor(condition: AnyClass<ApprovalCondition>): ApprovalSettingsReader {
    const { reads = [] } = condition as unknown as { readonly reads?: readonly string[] };
    const source = this.optional(ApprovalSettingsSource);
    // fail closed before `needed()` runs: a condition that cannot read its threshold is never "not needed"
    if (reads.length > 0 && source === undefined) throw ApprovalSettingsUnavailableError.create();
    return limitedSettingsReader(reads, (key) =>
      source === undefined
        ? Promise.reject(ApprovalSettingsUnavailableError.create())
        : source.get(key),
    );
  }

  /** Verifies the call's approval id and records who approved on the audit entry. */
  private async verified(
    call: Call,
    gate: ApprovalGate,
    input: unknown,
    approvalId: string,
  ): Promise<void> {
    const { descriptor } = call;
    const { bindings, actors, identity } = this.stageParts(descriptor.key);
    const record = await gate.find(approvalId);
    const binding = await bindings.find(approvalId);
    await verifyApproval({
      call: descriptor,
      inputHash: await fingerprintOf(descriptor.key, input),
      binding,
      record,
      executionKey: `approval:${approvalId}`,
      now: call.at,
      identity,
      actors,
    });
    call.state.audit.approvalId = approvalId;
    call.state.audit.voters = (record?.votes ?? []).map((vote) => vote.voter.id);
  }

  /**
   * After the isolation transaction ended on the approval refusal: takes a token from the action's buckets (so a refused
   * token writes nothing), then inserts the binding and parks the request in a fresh run for the same actor and scope.
   * Resolves to the error to throw: the original refusal, or what failed (logged by id, key and code only, never input).
   */
  private async parked(call: Call, refusal: unknown): Promise<unknown> {
    const parking = call.state.parking;
    if (parking === undefined) return refusal;
    const { descriptor } = call;
    try {
      await this.isolated(call, async () => {
        await this.limit(call);
        await this.required(
          ApprovalBindingStore,
          `${descriptor.key} parks an approval request, which needs a binding store (@stackra/tenancy)`,
        ).insert(parking.binding);
        await this.required(ApprovalGate, "").park(parking.draft);
      });
      return refusal;
    } catch (error) {
      this.optional(Logger)?.error(APPROVAL_PARK_FAILED, {
        approvalId: parking.binding.approvalId,
        key: descriptor.key,
        code: isRefusal(error) ? error.code : "unexpected",
      });
      return error;
    }
  }

  /**
   * The request of a `credentials: "ignore"` call: a fresh anonymous actor and the `UNCREDENTIALED` fields, plus a
   * storefront origin (the public surface itself, which an anonymous visitor's call carries too). An anonymous
   * caller's request is kept as it is, so it runs exactly as without the option.
   */
  private uncredentialed(request: CallOptions): CallOptions {
    if (request.actor.kind === ActorKind.Anonymous) return request;
    // an approval's key (`approval:<id>`, set by `keyed`) is the signed-in caller's, so it goes with the approval
    const fields = UNCREDENTIALED.filter(
      (field) =>
        request[field] !== undefined &&
        (field !== "idempotencyKey" || request.approvalId === undefined),
    );
    const kept = Object.fromEntries(fields.map((field) => [field, request[field]])) as Omit<
      CallOptions,
      "actor"
    >;
    return {
      ...kept,
      ...(request.origin?.kind === CallOriginKind.Storefront ? { origin: request.origin } : {}),
      actor: { kind: ActorKind.Anonymous, id: mintPublicId("anon") },
    };
  }

  /** The request with the key an approved call runs under: `approval:<id>`, whatever the caller sent (C1, S1). */
  private keyed(request: CallOptions): CallOptions {
    if (request.approvalId !== undefined)
      return { ...request, idempotencyKey: `approval:${request.approvalId}` };
    if (request.idempotencyKey?.startsWith("approval:") === true)
      throw InputInvalidError.create(
        {},
        { fieldErrors: { idempotencyKey: "a key that does not start with approval:" } },
      );
    return request;
  }

  /**
   * The steps before approval, in order (tenancy ran before, in `checkedTenancy`): the actor kind and permission (with an action's step-up), preconditions, entitlement, flag; resolves to the validated input.
   */
  private async checked(call: Call, raw: unknown): Promise<unknown> {
    const { descriptor, options, kind, ctx } = call;
    // an API key's caller reaches a `public` operation only, with a key; its scopes are checked by AccessControl
    const viaKey = descriptor.actor.kind === ActorKind.ApiClient;
    if (
      viaKey
        ? !keyMayCall(descriptor, options, kind)
        : !options.actors.includes(descriptor.actor.kind)
    )
      throw ForbiddenError.create();
    await this.required(AccessControl, IAM).require(descriptor);
    // step-up asks a user only: a service, job, system or agent call carries no assurance (ADR 0406 as amended)
    // `{ exempt: "first-factor-enrolment" }` is no level: that action enforces its own step-up (STA-340)
    const level =
      kind === "action" &&
      descriptor.actor.kind === ActorKind.User &&
      typeof options.stepUp === "string"
        ? options.stepUp
        : undefined;
    if (level !== undefined) {
      // an approved call stands on the assurance its binding recorded, measured at the request (ADR 0509, FR-016)
      const bound = await this.bindingOf(call);
      await this.required(
        StepUpCheck,
        `${descriptor.key} declares stepUp; bind a StepUpCheck driver over @stackra/identity's requireAssurance`,
      ).require(descriptor, bound?.assurance ?? call.request.assurance, level, bound?.requestedAt);
    }
    if (kind === "action")
      for (const type of options.preconditions ?? []) await this.resolver.get(type).check(ctx);
    await this.optional(EntitlementCheck)?.check(descriptor);
    await this.optional(FlagCheck)?.check(descriptor);
    const input = this.validated(call, raw);
    const cursor = (input as { readonly cursor?: unknown } | null | undefined)?.cursor;
    if (kind === "query" && typeof cursor === "string") call.state.replicaCursor = cursor;
    return input;
  }

  /** The binding of the approval id the call names, when it names one and a store is bound. */
  private async bindingOf(call: Call): Promise<ApprovalBinding | undefined> {
    const { approvalId } = call.request;
    if (approvalId === undefined || call.kind !== "action") return undefined;
    return this.optional(ApprovalBindingStore)?.find(approvalId);
  }

  /** The input checked against the registered input schema, when gen registered one. */
  private validated(call: Call, raw: unknown): unknown {
    const schema = call.registration?.input;
    if (schema === undefined) return raw;
    const result = validate(schema, raw);
    if (result.success) return result.data;
    const fieldErrors = Object.fromEntries(
      result.error.issues.map((issue) => [issue.path.join(".") || "(root)", issue.message]),
    );
    throw InputInvalidError.create({}, { fieldErrors });
  }

  /**
   * Refuses a call from a device the bound `DeviceStatusReader` reports revoked (`DeviceRevokedError`). Then runs
   * `work` for an action call replayed from a device's queue when its sequence is above the device's last settled
   * one, then settles it on an output or a refusal (a rejected call is settled too, so the next one may run). One at or
   * below the last settled may only replay its stored output (a resend after a lost response), which the idempotency
   * step enforces. A reused Idempotency-Key does not settle (the first call with it does), and any other error leaves
   * the sequence for a retry. Calls without a device sequence run as they are.
   */
  private async ordered(call: Call, work: () => Promise<unknown>): Promise<unknown> {
    const { device } = call.request;
    // A revoked device is refused before its sequence is touched, so nothing runs and nothing settles. Unbound, no
    // check: identity revoking the device's credential stays the first line (ADR 0361 decision 7).
    if (
      typeof device?.deviceId === "string" &&
      device.deviceId !== "" &&
      (await this.optional(DeviceStatusReader)?.isRevoked(device.deviceId)) === true
    )
      throw DeviceRevokedError.create();
    const sequence = device?.sequence;
    if (call.kind !== "action" || device === undefined || sequence === undefined) return work();
    const fieldErrors = {
      ...(typeof device.deviceId === "string" && device.deviceId !== ""
        ? {}
        : { "device.deviceId": "a device id" }),
      ...(Number.isSafeInteger(sequence) && sequence >= 1
        ? {}
        : { "device.sequence": "a whole number from 1" }),
    };
    if (Object.keys(fieldErrors).length > 0) throw InputInvalidError.create({}, { fieldErrors });
    const store = this.required(
      DeviceSequenceStore,
      "a call with device order needs one (the memory driver ships with @stackra/actions)",
    );
    const last = (await store.last(device.deviceId))?.sequence ?? 0;
    if (sequence <= last) {
      call.state.replayOnly = last;
      return work();
    }
    const settle = () => store.settle(device.deviceId, sequence, call.at, call.descriptor.scope);
    try {
      const output = await work();
      await settle();
      return output;
    } catch (error) {
      if (
        isRefusal(error) &&
        !isRefusal(error, IdempotencyKeyReusedError) &&
        !isRefusal(error, IdempotencyKeyInProgressError)
      )
        await settle();
      throw error;
    }
  }

  /**
   * Refuses a device's replayed call beyond its action's `offline.cap` within the window, counting the device's applied
   * calls; resolves to the amount (the input's `amount`, as the client reads it) to record once the call is applied, or
   * `undefined` when no cap applies.
   */
  private async capped(call: Call, input: unknown): Promise<number | undefined> {
    const cap = call.options.offline?.cap;
    const { device } = call.request;
    if (call.kind !== "action" || cap === undefined || device?.sequence === undefined)
      return undefined;
    const { descriptor, at } = call;
    const store = this.required(
      OfflineCapStore,
      `${descriptor.key} declares an offline cap; bind a store (the memory driver ships with @stackra/actions)`,
    );
    const since = new Date(at.getTime() - Duration.toMilliseconds(duration(cap.window)));
    const used = await store.usage(device.deviceId, descriptor.key, since);
    const amount = cap.amount === undefined ? 0 : this.amountOf(input, cap.amountField ?? "amount");
    if (
      (cap.count !== undefined && used.count >= cap.count) ||
      (cap.amount !== undefined && used.amount + amount > cap.amount)
    )
      throw OfflineCapReachedError.create();
    return amount;
  }

  /** The minor units in `input[field]`: a number, or a Money's `minor`. */
  private amountOf(input: unknown, field: string): number {
    const value = (input as Readonly<Record<string, unknown>> | null | undefined)?.[field];
    const minor =
      typeof value === "object" && value !== null
        ? (value as { readonly minor?: unknown }).minor
        : value;
    if (typeof minor === "number" && Number.isFinite(minor) && minor >= 0) return minor;
    throw InputInvalidError.create(
      {},
      { fieldErrors: { [field]: "an amount in minor units, or a Money" } },
    );
  }

  /** Claims the call's Idempotency-Key, or finds the earlier result to replay; `undefined` when the call has no key. */
  private async claim(
    call: Call,
    input: unknown,
  ): Promise<
    | {
        readonly held: string;
        readonly fingerprint: string;
        readonly ttl: Duration;
        /** Whether the key is the caller's own, not derived from the input. */
        readonly sent: boolean;
      }
    | { readonly replay: unknown }
    | undefined
  > {
    const policy = call.options.idempotency ?? Idempotency.Optional;
    // its output must never be kept (a credential): a sent key is ignored, so nothing is stored or replayed
    if (policy === Idempotency.Never) return undefined;
    const sent = call.request.idempotencyKey;
    const { descriptor } = call;
    // An API key's write needs its own key whatever the action declares (Pay FR-004, #850 G2); every other caller,
    // jobs and workflows included, keeps the declared policy
    const keyCaller =
      descriptor.credential !== undefined ||
      descriptor.actor.kind === ActorKind.ApiClient ||
      call.request.origin?.kind === CallOriginKind.ApiKey;
    if (sent === undefined && (policy === Idempotency.Required || keyCaller))
      throw IdempotencyKeyRequiredError.create();
    if (sent === undefined && policy !== Idempotency.Derived) return undefined;
    const fingerprint = await fingerprintOf(descriptor.key, input);
    // why: a generated client mints a fresh key per call, not per intent, so for any caller but an API key a Derived
    // action keeps deduplicating by its input (a double click on Refund stays one refund); an API key sends its own
    const derived = sent === undefined || (policy === Idempotency.Derived && !keyCaller);
    const key = derived || sent === undefined ? `derived:${fingerprint}` : sent;
    call.state.idempotencyKey = key;
    // the API key and the mode belong to the scope, so a principal's test and live keys (or two of its keys) never
    // share an answer
    const scoped = [
      descriptor.key,
      descriptor.scopeId ?? "-",
      descriptor.actor.id,
      descriptor.credential?.id ?? call.request.origin?.id ?? "-",
      descriptor.sandbox === true ? "test" : "live",
      key,
    ].join(":");
    const store = this.required(
      IdempotencyStore,
      `${descriptor.key} has an Idempotency-Key; bind a store (the memory driver ships with @stackra/actions)`,
    );
    // a store outside the transaction would mark the key done before the outer commit, which may still fail
    if (call.state.joined && !store.joinsTransaction)
      throw IdempotencyStoreNotTransactionalError.create();
    const own = call.options.idempotencyTtl;
    // a bound source (settings) sets the window; a failed read fails the call. It and an action may shorten the
    // window, never lengthen it past the 24 hours of ADR 0136
    const configured =
      (await this.optional(IdempotencyRetentionSource)?.retention(descriptor.scope)) ??
      IDEMPOTENCY_TTL;
    const window =
      Duration.toMilliseconds(configured) < Duration.toMilliseconds(IDEMPOTENCY_TTL)
        ? configured
        : IDEMPOTENCY_TTL;
    const ttl =
      own !== undefined && Duration.toMilliseconds(own) < Duration.toMilliseconds(window)
        ? own
        : window;
    const earlier = await store.claim(scoped, fingerprint, ttl);
    if (earlier === undefined) return { held: scoped, fingerprint, ttl, sent: !derived };
    if (earlier.fingerprint !== fingerprint) throw IdempotencyKeyReusedError.create();
    if (!earlier.done) throw IdempotencyKeyInProgressError.create();
    if ("refusal" in earlier) throw refusalFromStored(earlier.refusal);
    return { replay: earlier.output };
  }

  /**
   * Takes a token from the area's bucket (plan-sized by `RateLimitBudget` when it answers, else `RateLimitConfig`)
   * and from the action's own, refusing when either is empty. An action with no `rateLimit` takes from the
   * configured `actionDefault` buckets instead: one per scope and, when the call has a client, one per hashed
   * address. The area bucket is keyed by (app, scope) (ADR 0217 decision 2): the app is the origin's id
   * (storefront, API key, agent) or, without one, the actor. A refusal carries
   * the refusing bucket's numbers and, when an `EventOutbox` is bound, writes one `count` usage event on
   * `RATE_LIMITED_METER` ("limits are metered"). When a `RateLimitCapSource` is bound, each bucket's numbers are the
   * lower of its own and the scope's caps (the scope's settings), so an operator lowers a scope's limits without a
   * deploy; a failed caps read fails the call, never lets it through unlimited.
   */
  private async limit(call: Call): Promise<void> {
    const { descriptor, options, at } = call;
    const store = this.optional(RateLimitStore);
    if (store === undefined) {
      if (options.rateLimit !== undefined)
        throw new Error(`${descriptor.key} declares a rateLimit, so bind a RateLimitStore driver`);
      return;
    }
    const holder = descriptor.scopeId ?? descriptor.actor.id;
    const app = descriptor.origin?.id ?? descriptor.actor.id;
    const areaKey = `area:${descriptor.area}:${app}${descriptor.scopeId === undefined ? "" : `:${descriptor.scopeId}`}`;
    const takes: [key: string, bucket: RateLimitBucket][] = [];
    const config = this.optional(RateLimitConfig);
    const area = config?.areas[descriptor.area];
    // shortcut: a cap only lowers a limit (min), so a scope that writes its own caps can only throttle itself; once the
    // read-side level source (STA-2631) tells a platform cap from a scope's own, a platform cap may raise one.
    const caps = await this.optional(RateLimitCapSource)?.caps(descriptor.area, descriptor.scope);
    const planned =
      (await this.optional(RateLimitBudget)?.areaBucket(descriptor)) ??
      (area === undefined
        ? undefined
        : {
            capacity: area.burst,
            tokensPerSecond: area.requests / (Duration.toMilliseconds(area.per) / 1000),
          });
    if (planned !== undefined)
      takes.push([
        areaKey,
        {
          capacity: Math.min(planned.capacity, caps?.burst ?? Infinity),
          tokensPerSecond: Math.min(planned.tokensPerSecond, (caps?.perMinute ?? Infinity) / 60),
        },
      ]);
    const own = options.rateLimit;
    const fallback = own === undefined ? config?.actionDefault : undefined;
    if (own !== undefined) {
      const by = own.by ?? "principal";
      takes.push([
        `action:${descriptor.key}:${by}:${by === "tenant" ? holder : descriptor.actor.id}`,
        { capacity: own.perMinute, tokensPerSecond: own.perMinute / 60 },
      ]);
    } else if (fallback !== undefined) {
      const perScope = Math.min(fallback.perScope, caps?.actionPerScope ?? Infinity);
      const perAddress = Math.min(fallback.perAddress, caps?.actionPerAddress ?? Infinity);
      takes.push([
        `action:${descriptor.key}:scope:${holder}`,
        { capacity: perScope, tokensPerSecond: perScope / 60 },
      ]);
      const address = call.request.client?.address;
      // The store sees a hash, never the address (CallClient goes to no port).
      // shortcut: an unsalted SHA-256, which an IPv4 brute force reverses; key it with a secret if the store is shared.
      if (address !== undefined)
        takes.push([
          `action:${descriptor.key}:address:${await fingerprintOf(address)}`,
          { capacity: perAddress, tokensPerSecond: perAddress / 60 },
        ]);
    }
    for (const [key, bucket] of takes) {
      const decision = await store.take(key, bucket, at);
      if (decision.allowed) continue;
      // the usage event is a write the refusal's rollback would undo (and a query's transaction is read-only), so it is
      // written after the isolation transaction ends, in `steps`
      if (this.optional(EventOutbox) !== undefined) call.state.unmetered = true;
      throw RateLimitedError.create({
        // A bucket that never refills (`Infinity`) has no hint: JSON would carry it as null.
        ...(Number.isFinite(decision.retryAfterMs) ? { retryAfterMs: decision.retryAfterMs } : {}),
        limit: bucket.capacity,
        remaining: decision.remaining,
      });
    }
  }

  /**
   * Runs the interceptors around `handle`, the first outermost. An action's `handle` runs in its unit of work with its
   * usage event and its success audit entry (so the entry commits or rolls back with the writes), and the unit of work
   * runs inside the limit reservation when one is bound (reserve, then commit).
   */
  private intercepted(call: Call, input: unknown): Promise<unknown> {
    const instance = this.resolver.get(call.type) as unknown as Handler;
    const handle = () =>
      this.budgeted(call, () => this.routed(call, () => instance.handle(input, call.ctx)));
    const accepts = call.kind === "action" ? call.options.accepts : undefined;
    const reviewed =
      accepts === undefined ? handle : () => this.reviewed(call, accepts, input, handle);
    const meter = call.kind === "action" ? call.options.meter : undefined;
    const run = async () => {
      const output = await reviewed();
      if (meter !== undefined) await this.metered(call, meter, input);
      if (call.options.analytics !== undefined) {
        await this.track(call, "ok", input, output);
        call.state.tracked = true;
      }
      const trail = this.optional(AuditTrail);
      if (trail !== undefined) {
        await trail.record(this.auditEntry(call, "ok"));
        call.state.audited = true;
      }
      return output;
    };
    const core =
      call.kind === "action"
        ? () => {
            const unit = this.optional(UnitOfWork);
            const timeout = call.options.timeout;
            const commit = () =>
              unit === undefined
                ? run()
                : unit.transaction(run, timeout === undefined ? undefined : { timeout });
            const reservation = this.optional(LimitReservation);
            return reservation === undefined
              ? commit()
              : reservation.reserve(call.descriptor, input, commit);
          }
        : () => this.cached(call, input, handle);
    return call.options.interceptors
      .map((type) => this.resolver.get(type))
      .reduceRight<() => Promise<unknown>>((next, interceptor) => {
        let called = false;
        return () =>
          interceptor.intercept(call.ctx, () => {
            if (called)
              return Promise.reject(
                new Error(`${interceptor.constructor.name} called next() twice`),
              );
            called = true;
            return next();
          });
      }, core)();
  }

  /**
   * Runs a `reads: "replica"` query's `handle` on a replica through `ReplicaReads`, unless the caller's read-your-writes
   * window is open (its own write, here or carried as `lastWriteAt`); every other call, and every call with no
   * `ReplicaReads` bound, runs as it is (on the primary).
   */
  private async routed(call: Call, handle: () => Promise<unknown>): Promise<unknown> {
    const reads = call.options.reads === "replica" ? this.optional(ReplicaReads) : undefined;
    if (
      reads === undefined ||
      (await reads.pinned(this.writerOf(call.descriptor), call.at, call.request.lastWriteAt))
    )
      return handle();
    return reads.onReplica(handle);
  }

  /**
   * Counts the statements `handle` runs through `QueryBudget` when one is bound: past the call's `queryBudget`, or one
   * statement shape repeated past the configured limit, the driver warns with the key (fails in strict mode).
   */
  private budgeted(call: Call, handle: () => Promise<unknown>): Promise<unknown> {
    const budget = this.optional(QueryBudget);
    return budget === undefined
      ? handle()
      : budget.within(call.descriptor.key, call.options.queryBudget, handle);
  }

  /** Whose read-your-writes window a call opens or reads: the actor in its scope (`<scope>:<actor>`). */
  private writerOf(descriptor: CallDescriptor): string {
    return `${descriptor.scope?.id ?? descriptor.scopeId ?? "-"}:${descriptor.actor.id}`;
  }

  /**
   * The cache step of a query that declares `cache`: answers from its entry, or runs `handle` once (callers of one key
   * share the load) and stores the answer for the `ttl`. The entry is read and written in the shared namespace under
   * a key that carries the tenant and the `cache.per` holder (`queryCacheKey`), so `QueryCacheEvictorListener` reaches
   * it from an event; `handle` runs in the call's own context. With no `Cache` bound the step does not run.
   */
  private async cached(
    call: Call,
    input: unknown,
    handle: () => Promise<unknown>,
  ): Promise<unknown> {
    const declared = call.options.cache;
    const cache = this.optional(Cache);
    if (declared === undefined || cache === undefined) return handle();
    const key = await queryCacheKey(
      call.type,
      declared.per ?? CacheScope.Principal,
      call.descriptor,
      call.ctx,
      input,
    );
    const ttl = duration(declared.ttl);
    const storage = this.optional(ContextStorage);
    if (storage === undefined) return cache.remember(key, ttl, handle);
    return storage.run(SHARED_CACHE_CONTEXT, () =>
      cache.remember(key, ttl, () => storage.run(call.ctx, handle)),
    );
  }

  /**
   * Re-evaluates an offline-computed document on the server, runs `handle`, and records a review item with both answers
   * when they differ or the document's rule version is older than the action accepts. It never refuses the call: the
   * server's figure is what `handle` applies. Runs in the action's unit of work, so a review item exists only for an
   * applied document.
   */
  private async reviewed(
    call: Call,
    accepts: ActionAccepts,
    input: unknown,
    handle: () => Promise<unknown>,
  ): Promise<unknown> {
    const { descriptor, at } = call;
    const sink = this.required(
      ReviewItemSink,
      `${descriptor.key} accepts offline documents; bind a sink (the memory driver ships with @stackra/actions)`,
    );
    const evaluation = await this.resolver
      .get(accepts.evaluator)
      .evaluate(input as never, call.ctx as ActionContext);
    const output = await handle();
    if (evaluation === undefined) return output;
    const older = isOlderRuleVersion(evaluation.ruleVersion, accepts.ruleVersion);
    if (
      older ||
      (await fingerprintOf(evaluation.client)) !== (await fingerprintOf(evaluation.server))
    )
      await sink.record(
        Object.freeze({
          call: descriptor,
          at,
          reason: older ? ReviewReason.OlderRuleVersion : ReviewReason.Differs,
          ruleVersion: evaluation.ruleVersion,
          acceptedVersion: accepts.ruleVersion,
          client: evaluation.client,
          server: evaluation.server,
          output,
        }),
      );
    return output;
  }

  /**
   * Writes the `usage.recorded` event of one applied call of a metered action through the outbox, inside its unit of
   * work: 1 for `count`, the field's units for `sum`, `max` and `last`, and the field's value as the subject of
   * `unique`.
   */
  private async metered(call: Call, meter: ActionMeter, input: unknown): Promise<void> {
    const { descriptor, at } = call;
    const outbox = this.required(
      EventOutbox,
      `${descriptor.key} declares a meter; bind the EventOutbox (install @stackra/outbox)`,
    );
    let value = 1;
    let subject: string | undefined;
    if (meter.kind === MeterKind.Unique) {
      const raw = (input as Readonly<Record<string, unknown>> | null | undefined)?.[
        meter.field ?? ""
      ];
      if (typeof raw !== "string" && typeof raw !== "number")
        throw InputInvalidError.create(
          {},
          { fieldErrors: { [meter.field ?? "(root)"]: "a value to count once" } },
        );
      subject = String(raw);
    } else if (meter.kind !== MeterKind.Count) value = this.amountOf(input, meter.field ?? "");
    const event = UsageRecorded.create({
      meter: meter.name,
      kind: meter.kind,
      value,
      ...(subject === undefined ? {} : { subject }),
      key: descriptor.key,
      callId: descriptor.callId,
      ...(descriptor.scope === undefined ? {} : { scopeId: descriptor.scope.id }),
    });
    await outbox.write([
      {
        event,
        meta: {
          id: mintPublicId("evt"),
          occurredAt: at,
          ...(descriptor.scopeId === undefined ? {} : { scopeId: descriptor.scopeId }),
          actor: descriptor.actor,
          correlationId: descriptor.callId,
        },
      },
    ]);
  }

  /**
   * Runs `work` and writes the call's analytics event for what the unit of work did not: a successful query (no unit of
   * work) and, for `analytics: true`, a refusal (its writes rolled back, so the event is written after). An idempotent
   * replay tracks nothing: the first call did. Calls that declare no `analytics` run as they are.
   */
  private async analyzed(call: Call, work: () => Promise<unknown>): Promise<unknown> {
    if (call.options.analytics === undefined) return work();
    try {
      const output = await work();
      if (call.kind === "query") await this.track(call, "ok", undefined, output);
      return output;
    } catch (error) {
      if (isRefusal(error) && call.options.analytics === true)
        await this.track(call, "refused", undefined, undefined, error.code);
      throw error;
    }
  }

  /**
   * Writes one `analytics.tracked` event through the outbox when the call's consent grants `analytics` (ADR 0472):
   * `action.called` with the key, outcome, refusal code, duration and origin, or the declared `AnalyticsEvent`'s
   * fields read from the output, then the input (its schema keeps only its declared fields). Output that does not
   * fit the event's schema skips the event with a warning: analytics never fails a call.
   */
  private async track(
    call: Call,
    outcome: "ok" | "refused",
    input: unknown,
    output: unknown,
    code?: string,
  ): Promise<void> {
    const { descriptor, at, ctx, options } = call;
    const declared = options.analytics;
    if (declared === undefined) return;
    const consent = await ctx.consent();
    if (!consent.verified || !consent.granted.includes(ANALYTICS_CONSENT_CATEGORY)) return;
    let name = ACTION_CALLED_EVENT;
    let properties: Record<string, Json> = {
      key: descriptor.key,
      outcome,
      ...(code === undefined ? {} : { code }),
      durationMs: Math.round(globalThis.performance.now() - call.state.startedMs),
      ...(descriptor.origin === undefined ? {} : { origin: descriptor.origin.kind }),
    };
    if (declared !== true) {
      const fields = { ...this.objectOf(input), ...this.objectOf(output) };
      const parsed = schemaOf(declared).safeParse(fields);
      if (!parsed.success) {
        this.optional(Logger)?.warn(ANALYTICS_SKIPPED, {
          key: descriptor.key,
          callId: descriptor.callId,
          event: declared.name,
        });
        return;
      }
      // Action() and Query() refused any class that is not an AnalyticsEvent, so its kind record names it.
      const record = kindOf(declared as unknown as AnyClass)?.options as
        | { readonly name?: string }
        | undefined;
      name = record?.name ?? declared.name;
      properties = parsed.data as Record<string, Json>;
    }
    const { actor } = descriptor;
    await this.required(
      EventOutbox,
      `${descriptor.key} declares analytics; bind the EventOutbox (install @stackra/outbox)`,
    ).write([
      {
        event: AnalyticsTracked.create({
          eventId: mintPublicId("evt"),
          name,
          properties,
          occurredAt: at.toISOString(),
          anonymousId: consent.subject,
          ...(actor.kind === ActorKind.User ? { userId: actor.id } : {}),
          callId: descriptor.callId,
          key: descriptor.key,
          locale: ctx.locale,
          ...(descriptor.scope === undefined ? {} : { scopeId: descriptor.scope.id }),
        }),
        meta: {
          id: mintPublicId("evt"),
          occurredAt: at,
          ...(descriptor.scopeId === undefined ? {} : { scopeId: descriptor.scopeId }),
          actor,
          correlationId: descriptor.callId,
        },
      },
    ]);
  }

  /** `value`'s own fields when it is a plain object, else none. */
  private objectOf(value: unknown): Record<string, unknown> {
    return typeof value === "object" && value !== null && !Array.isArray(value)
      ? (value as Record<string, unknown>)
      : {};
  }

  /**
   * Writes `event`, an integration event no model owns, through the outbox with the call's metadata: called from
   * `handle`, it lands in the action's unit of work, so it leaves only when the call commits.
   */
  private async published(descriptor: CallDescriptor, at: Date, event: Event): Promise<void> {
    if (kindOf(event.constructor as AnyClass)?.kind !== "integration_event")
      throw new TypeError(
        `${descriptor.key} published ${event.constructor.name}, which is not an IntegrationEvent: record a domain event on its model`,
      );
    await this.required(
      EventOutbox,
      `${descriptor.key} publishes an event; install @stackra/outbox`,
    ).write([
      {
        event,
        meta: {
          id: mintPublicId("evt"),
          occurredAt: at,
          ...(descriptor.scopeId === undefined ? {} : { scopeId: descriptor.scopeId }),
          actor: descriptor.actor,
          correlationId: descriptor.callId,
        },
      },
    ]);
  }

  /** Runs the work queued with `ctx.afterCommit`, in order; a failure is logged and never fails the call. */
  private async afterCommit(call: Call): Promise<void> {
    for (const work of call.state.afterCommit)
      try {
        await work();
      } catch (error) {
        // shortcut: dropped silently when no Logger is bound; every booted container binds one.
        this.optional(Logger)?.error(AFTER_COMMIT_FAILED, {
          key: call.descriptor.key,
          callId: call.descriptor.callId,
          cause: error,
        });
      }
  }

  /**
   * Runs `work` and writes the action's audit entry for what the unit of work did not: a refusal (its writes rolled
   * back, so the entry is written after) and an idempotent replay (no unit of work ran). Queries are not audited.
   */
  private async audited(call: Call, work: () => Promise<unknown>): Promise<unknown> {
    if (call.kind === "query") return work();
    const trail = this.optional(AuditTrail);
    try {
      const output = await work();
      if (!call.state.audited) await trail?.record(this.auditEntry(call, "ok"));
      return output;
    } catch (error) {
      if (isRefusal(error)) await trail?.record(this.auditEntry(call, "refused", error.code));
      throw error;
    }
  }

  /** The action's audit entry with `outcome`, and the fields the handler added so far. */
  private auditEntry(call: Call, outcome: "ok" | "refused", code?: string): AuditEntry {
    return {
      call: call.descriptor,
      at: call.at,
      outcome,
      ...(code === undefined ? {} : { code }),
      fields: Object.freeze({ ...call.state.audit }),
    };
  }

  /** The context handed to preconditions, interceptors and `handle`. */
  private contextOf(
    descriptor: CallDescriptor,
    request: CallOptions,
    at: Date,
    state: CallState,
  ): QueryContext | ActionContext {
    const timeZone = request.timeZone ?? CALL_DEFAULTS.timeZone;
    let consent: Promise<CallConsent> | undefined;
    const query: QueryContext = {
      callId: descriptor.callId,
      key: descriptor.key,
      actor: descriptor.actor,
      ...(descriptor.scopeId === undefined ? {} : { scopeId: descriptor.scopeId }),
      ...(descriptor.scope === undefined ? {} : { scope: descriptor.scope }),
      locale: request.locale ?? CALL_DEFAULTS.locale,
      timeZone,
      currency: request.currency ?? CALL_DEFAULTS.currency,
      market: request.market ?? CALL_DEFAULTS.market,
      ...(descriptor.origin === undefined ? {} : { origin: descriptor.origin }),
      abortSignal: request.abortSignal ?? new AbortController().signal,
      now: () => new Date(at),
      authorize: (record: object) =>
        this.required(AccessControl, IAM).authorize(descriptor, record),
      period: (input: PeriodInput) => periodOf(input, at, timeZone),
      startOfDay: () => startOfZonedDay(at, timeZone),
      ...(request.device === undefined ? {} : { deviceId: request.device.deviceId }),
      ...(request.assurance === undefined ? {} : { assurance: request.assurance }),
      ...(descriptor.sandbox === true ? { sandbox: true as const } : {}),
      ...(request.client === undefined ? {} : { client: request.client }),
      consent: () => {
        consent ??= this.consentOf(descriptor, request.consentSnapshot);
        return consent;
      },
      memo: <T>(key: string, load: () => Promise<T>): Promise<T> => {
        let answer = state.memo.get(key);
        if (answer === undefined) {
          answer = load();
          state.memo.set(key, answer);
          // A failed load is not kept, so a later read in the call tries again.
          answer.catch(() => state.memo.delete(key));
        }
        return answer as Promise<T>;
      },
      replica: (fill: (bounds: ReplicaBounds) => Promise<readonly ReplicaRow[]>, slice?: string) =>
        new ReplicaFeed(
          this.required(
            ReplicaLog,
            "a replica query needs one (the memory driver ships with @stackra/actions)",
          ),
        ).page(
          descriptor.type,
          {
            ...(state.replicaCursor === undefined ? {} : { cursor: state.replicaCursor }),
            ...(descriptor.scope === undefined ? {} : { within: descriptor.scope }),
            at,
          },
          fill,
          slice,
        ),
    };
    if (descriptor.kind === "query") return Object.freeze(query);
    const action: ActionContext = {
      ...query,
      ...(request.attempt === undefined ? {} : { attempt: request.attempt }),
      ...(request.expectedVersion === undefined
        ? {}
        : { expectedVersion: request.expectedVersion }),
      get idempotencyKey() {
        return state.idempotencyKey;
      },
      afterCommit: (work: () => unknown) => {
        state.afterCommit.push(work);
      },
      audit: (fields: Readonly<Record<string, Json>>) => {
        Object.assign(state.audit, fields);
      },
      run: <O>(workflow: AnyClass, input: unknown) =>
        this.required(WorkflowRunner, "install @stackra/workflow to run a workflow").run(
          workflow,
          input,
          descriptor,
        ) as Promise<O>,
      signal: (signal: AnyClass, payload: object, correlation?: object) =>
        this.required(WorkflowRunner, "install @stackra/workflow to send a signal").signal(
          signal,
          payload,
          correlation,
          descriptor,
        ),
      dispatch: <A extends object>(type: AnyClass<A>, input: CallInput<A>) =>
        this.required(JobDispatcher, "install @stackra/queue to dispatch a job").dispatch(
          type,
          input,
          descriptor,
        ),
      publish: (event: Event) => this.published(descriptor, at, event),
      detach: () => this.detachedOf(descriptor, action),
    };
    return Object.freeze(action);
  }

  /**
   * The call's isolation held past its transaction (`ctx.detach()`): `run` stores a copy of the call's context, which
   * `RequestContext.detached()` answers with this call, inside every wrapper of `DETACHED_RUNS` (the database leaves
   * the call's finished transaction there and keeps the step for `CrudService`), and `isolated` opens a step through
   * `CallIsolation` with the descriptor's actor and scope, as `isolated(call, ...)` does for the call itself, so its
   * checks run again per step. A step opened outside `run` enters the wrappers first; inside `run` it does not, so a
   * step inside a step joins it.
   */
  private detachedOf(descriptor: CallDescriptor, ctx: ActionContext): DetachedCall {
    const storage = this.optional(ContextStorage);
    // a copy, so the call's own context never reads as detached
    const view: object = Object.freeze({ ...ctx });
    const step: DetachedStep = <T>(work: () => Promise<T>): Promise<T> => {
      const isolation = this.optional(CallIsolation);
      return isolation === undefined
        ? work()
        : isolation.run(descriptor.actor, descriptor.scope, () => work(), { readOnly: false });
    };
    const within = <T>(work: () => Promise<T>): Promise<T> => {
      // the first registered wrapper is the outermost
      const next = [...DETACHED_RUNS].reduceRight<() => Promise<T>>(
        (inner, wrapper) => () => wrapper(step, inner),
        work,
      );
      return storage === undefined ? next() : storage.run(view, next);
    };
    const detached: DetachedCall = Object.freeze({
      actor: descriptor.actor,
      ...(descriptor.scope === undefined ? {} : { scope: descriptor.scope }),
      run: within,
      isolated: <T>(work: () => Promise<T>): Promise<T> =>
        storage !== undefined && storage.current() === view ? step(work) : within(() => step(work)),
    });
    DETACHED_CALLS.set(view, detached);
    return detached;
  }

  /**
   * The call's consent (ADR 0472): refused as `missing` without a snapshot and `unchecked` without a bound
   * `ConsentCheck`; otherwise the check's answer. Never a refusal of the call.
   */
  private async consentOf(
    descriptor: CallDescriptor,
    snapshot: string | undefined,
  ): Promise<CallConsent> {
    if (snapshot === undefined || snapshot === "")
      return Object.freeze({ verified: false, refusal: ConsentRefusal.Missing, granted: [] });
    const check = this.optional(ConsentCheck);
    if (check === undefined)
      return Object.freeze({ verified: false, refusal: ConsentRefusal.Unchecked, granted: [] });
    return check.check(snapshot, descriptor);
  }

  /** The bound instance of `port`. */
  private required<T extends object>(port: AnyClass<T>, hint: string): T {
    if (!this.resolver.has(port)) throw new Error(`${port.name} is not bound: ${hint}`);
    return this.resolver.get(port);
  }

  /** The bound instance of `port`, or `undefined` when its owner is not installed. */
  private optional<T extends object>(port: AnyClass<T>): T | undefined {
    return this.resolver.has(port) ? this.resolver.get(port) : undefined;
  }
}
