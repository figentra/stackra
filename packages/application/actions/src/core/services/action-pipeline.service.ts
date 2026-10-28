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
 *          The permission step includes an action's step-up (`stepUp`, through `StepUpCheck`), and the call context
 *          carries the caller's verified assurance (`ctx.assurance`), the sandbox flag (`ctx.sandbox`, also on the
 *          descriptor) and the network client (`ctx.client`, never on the descriptor or the audit entry; STA-1248),
 *          the request origin (`ctx.origin`, also on the descriptor, so the audit entry carries it) and an action's
 *          integration event without a model (`ctx.publish`, through the outbox in its unit of work; ADR 0456).
 * Boundary: built by the runtime (and the testing module) over a `Resolver`, so it reads the action instances, their
 *           preconditions and interceptors and every step's port by class. Steps whose owner is not installed are
 *           skipped (tenancy, entitlement, flag, limit reservation, unit of work, audit); permission fails closed (no
 *           `AccessControl` is an error, never an allowed call); approval runs only when an `ApprovalGate` is bound,
 *           except that an action declaring `approval: true` fails closed without one (ADR 0397 as amended); a declared rate limit, Idempotency-Key, device order,
 *           offline cap, `accepts`, replica, `structural`, `meter` or `stepUp` with no port bound is an error. The approval gate
 *           sees the validated input; a metered action's usage event and a successful call's audit entry are written
 *           in its unit of work, after `handle`, and the unit of work runs inside the `LimitReservation` (reserve, then
 *           commit). Nothing reorders the steps: device order wraps them all (like the audit, whose refusal and replay
 *           entries are written outside), so a call refused by any step still settles its sequence; the cap is part
 *           of the idempotency step and the review part of `handle`. A device's sequences are strictly increasing, not contiguous: one above
 *           the last settled is applied (the client sends one call at a time, so it is the next), one at or below may
 *           only replay its stored output. Only a Refusal is a refusal; any other error is a bug and propagates.
 * Runtime: isomorphic
 * Governing contract: ADR 0138 (as amended by 0294: the order is fixed); ADR 0136 (decisions 1 to 3 and 5); ADR 0305
 *                     (rule 24: interceptors); ADR 0217 (decision 2: limits enforced in the pipeline); ADR 0098; ADR
 *                     0327 (decision 6: the current scope in the call context); ADR 0338 (decisions 1, 3 and 5); ADR
 *                     0337 (decisions 4 and 5); ADR 0098 (decision 3: approval); ADR 0359 (decision 3: live is
 *                     read-only); ADR 0216 (decisions 1 and 4: usage through the outbox); ADR 0212 (decision 4: the
 *                     audit in the unit of work); ADR 0215 and owner round 3 item 18 (reserve-then-commit); STA-813
 *                     (an unbound approval step does not run); ADR 0406
 *                     (step-up assurance); STA-1277 (the area bucket sized by `RateLimitBudget`, a value entitlement);
 *                     ADR 0456 (decisions 1 and 2: the request origin, an integration event without a model); STA-1380
 *                     (event ids from @stackra/contracts' `mintPublicId`).
 */
import { kindOf, type AnyClass } from "@stackra/container";
import {
  type ActorKind,
  type ApiArea,
  type AssuranceLevel,
  Clock,
  Duration,
  type Json,
  Logger,
  MeterKind,
  mintPublicId,
} from "@stackra/contracts";
import {
  ForbiddenError,
  IdempotencyKeyReusedError,
  isRefusal,
  RateLimitedError,
} from "@stackra/errors";
import type { Event } from "@stackra/events";
import { EventOutbox } from "@stackra/events/contracts";
import { duration, validate } from "@stackra/validation";

import { RateLimitConfig } from "#config/rate-limit.config";
import { ReviewReason } from "#contracts/enums/review-reason.enum";
import { AccessControl } from "#contracts/ports/access-control.port";
import { ApprovalGate } from "#contracts/ports/approval-gate.port";
import { AuditTrail } from "#contracts/ports/audit-trail.port";
import { ContextStorage } from "#contracts/ports/context-storage.port";
import { DeviceSequenceStore } from "#contracts/ports/device-sequence-store.port";
import { EntitlementCheck } from "#contracts/ports/entitlement-check.port";
import { FlagCheck } from "#contracts/ports/flag-check.port";
import { IdempotencyStore } from "#contracts/ports/idempotency-store.port";
import { JobDispatcher } from "#contracts/ports/job-dispatcher.port";
import { LimitReservation } from "#contracts/ports/limit-reservation.port";
import { LiveConfigurationGuard } from "#contracts/ports/live-configuration-guard.port";
import { OfflineCapStore } from "#contracts/ports/offline-cap-store.port";
import { RateLimitBudget } from "#contracts/ports/rate-limit-budget.port";
import { RateLimitStore } from "#contracts/ports/rate-limit-store.port";
import { ReplicaLog } from "#contracts/ports/replica-log.port";
import { ReviewItemSink } from "#contracts/ports/review-item-sink.port";
import { StepUpCheck } from "#contracts/ports/step-up-check.port";
import { TenancyCheck } from "#contracts/ports/tenancy-check.port";
import { UnitOfWork } from "#contracts/ports/unit-of-work.port";
import { WorkflowRunner } from "#contracts/ports/workflow-runner.port";
import type { AuditEntry } from "#contracts/types/audit-entry.type";
import type { CallDescriptor } from "#contracts/types/call-descriptor.type";
import type { RateLimitBucket } from "#contracts/types/rate-limit-bucket.type";
import type { ReplicaRow } from "#contracts/types/replica-row.type";
import type { Action } from "#core/bases/action.base";
import type { Interceptor } from "#core/bases/interceptor.base";
import type { Precondition } from "#core/bases/precondition.base";
import type { Query } from "#core/bases/query.base";
import { ACTION_REGISTRY } from "#core/constants/action-registry.constant";
import { AFTER_COMMIT_FAILED } from "#core/constants/after-commit-failed.constant";
import { CALL_DEFAULTS } from "#core/constants/call-defaults.constant";
import { IDEMPOTENCY_TTL } from "#core/constants/idempotency-ttl.constant";
import { PROPOSAL_METER } from "#core/constants/proposal-meter.constant";
import { Idempotency } from "#core/enums/idempotency.enum";
import { DeviceSequenceOutOfOrderError } from "#core/errors/device-sequence-out-of-order.error";
import { IdempotencyKeyRequiredError } from "#core/errors/idempotency-key-required.error";
import { InputInvalidError } from "#core/errors/input-invalid.error";
import { OfflineCapReachedError } from "#core/errors/offline-cap-reached.error";
import { UsageRecorded } from "#core/events/usage-recorded.event";
import { fingerprintOf } from "#core/functions/fingerprint-of.function";
import { isOlderRuleVersion } from "#core/functions/is-older-rule-version.function";
import { periodOf } from "#core/functions/period-of.function";
import { startOfZonedDay } from "#core/functions/start-of-zoned-day.function";
import { ReplicaFeed } from "#core/services/replica-feed.service";
import type { ActionAccepts } from "#core/types/action-accepts.type";
import type { ActionContext } from "#core/types/action-context.type";
import type { ActionDraft } from "#core/types/action-draft.type";
import type { ActionEffects } from "#core/types/action-effects.type";
import type { ActionMeter } from "#core/types/action-meter.type";
import type { ActionRateLimit } from "#core/types/action-rate-limit.type";
import type { ActionRegistration } from "#core/types/action-registration.type";
import type { CallInput } from "#core/types/call-input.type";
import type { CallOptions } from "#core/types/call-options.type";
import type { OfflineOptions } from "#core/types/offline-options.type";
import type { OutputOf } from "#core/types/output-of.type";
import type { PeriodInput } from "#core/types/period-input.type";
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
  readonly rateLimit?: ActionRateLimit;
  readonly offline?: OfflineOptions;
  readonly accepts?: ActionAccepts;
  readonly structural?: boolean;
  readonly meter?: ActionMeter;
  readonly effects?: ActionEffects;
  readonly approval?: boolean;
  readonly stepUp?: AssuranceLevel;
}

/** What one call accumulates while it runs. */
interface CallState {
  idempotencyKey: string | undefined;
  /** Set when a device resends a sequence at or below its last settled one: only a replay may answer; that last one. */
  replayOnly: number | undefined;
  /** A replica query's change cursor: the validated input's `cursor`. */
  replicaCursor: string | undefined;
  readonly afterCommit: (() => unknown)[];
  readonly audit: Record<string, Json>;
  /** Set once the success entry was written inside the unit of work, so the outer audit does not write it again. */
  audited: boolean;
}

/** Everything one call carries through the steps. */
interface Call {
  readonly type: AnyClass<Action | Query>;
  readonly kind: "action" | "query";
  readonly options: Recorded;
  readonly registration: ActionRegistration | undefined;
  readonly descriptor: CallDescriptor;
  readonly request: CallOptions;
  readonly at: Date;
  readonly state: CallState;
  readonly ctx: QueryContext | ActionContext;
}

/** An instance whose `handle` the pipeline calls. */
type Handler = { handle: (input: unknown, ctx: unknown) => Promise<unknown> };

const IAM = "bind an AccessControl driver (@stackra/iam); calls fail closed without one";

const APPROVALS =
  "declares approval: true, so bind an ApprovalGate driver (the OS tasks-approvals service); it fails closed without one";

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
    const call = this.prepare(type, request);
    const work = () => this.audited(call, () => this.ordered(call, () => this.steps(call, input)));
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
    const work = async (): Promise<ActionDraft> => {
      const checked = await this.checked(call, input);
      await this.metered(call, { name: PROPOSAL_METER, kind: MeterKind.Count }, checked);
      return Object.freeze({
        key: call.descriptor.key,
        callId: call.descriptor.callId,
        input: checked,
        proposedAt: call.at,
      });
    };
    const storage = this.optional(ContextStorage);
    return storage === undefined ? work() : storage.run(call.ctx, work);
  }

  /** The call `type` makes under `request`: its options, identity, descriptor, state and context. */
  private prepare(type: AnyClass<Action | Query>, request: CallOptions): Call {
    const record = kindOf(type);
    if (record?.kind !== "action" && record?.kind !== "query")
      throw new TypeError(
        `${type.name} is not an action or a query: extend Action({...}) or Query({...})`,
      );
    const options = record.options as unknown as Recorded;
    const registration = ACTION_REGISTRY.get(type);
    const at = this.optional(Clock)?.now() ?? new Date();
    const { actor } = request;
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
      ...(actor.scopeId === undefined ? {} : { scopeId: actor.scopeId }),
      ...(request.scope === undefined ? {} : { scope: request.scope }),
      area: options.area,
      ...(request.sandbox === true ? { sandbox: true as const } : {}),
      ...(request.origin === undefined ? {} : { origin: Object.freeze({ ...request.origin }) }),
    });
    const state: CallState = {
      idempotencyKey: undefined,
      replayOnly: undefined,
      replicaCursor: undefined,
      afterCommit: [],
      audit: {},
      audited: false,
    };
    const ctx = this.contextOf(descriptor, request, at, state);
    return { type, kind: record.kind, options, registration, descriptor, request, at, state, ctx };
  }

  /** The steps, in the fixed order. */
  private async steps(call: Call, raw: unknown): Promise<unknown> {
    const { descriptor, kind } = call;
    const input = await this.checked(call, raw);
    if (kind === "action") await this.approved(call, input);
    const claim = kind === "action" ? await this.claim(call, input) : undefined;
    if (claim !== undefined && "replay" in claim) return claim.replay;
    try {
      if (call.state.replayOnly !== undefined)
        throw DeviceSequenceOutOfOrderError.create({ acknowledged: call.state.replayOnly });
      const amount = await this.capped(call, input);
      await this.limit(call);
      const output = await this.intercepted(call, input);
      if (claim !== undefined)
        await this.required(IdempotencyStore, "").complete(claim.held, output);
      if (amount !== undefined && call.request.device?.sequence !== undefined)
        await this.required(OfflineCapStore, "").record(
          call.request.device.deviceId,
          descriptor.key,
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

  /**
   * The approval step of an action: a bound `ApprovalGate` decides every call; with none bound the step does not run,
   * except for an action that declares `approval: true`, which fails closed.
   */
  private async approved(call: Call, input: unknown): Promise<void> {
    const gate = this.optional(ApprovalGate);
    if (gate !== undefined) return gate.check(call.descriptor, input, call.request.approvalId);
    if (call.options.approval === true)
      throw new Error(`ApprovalGate is not bound: ${call.descriptor.key} ${APPROVALS}`);
  }

  /**
   * The steps before approval, in order: tenancy (with the live-configuration guard of a structural action), the actor
   * kind and permission (with an action's step-up), preconditions, entitlement, flag; resolves to the validated input.
   */
  private async checked(call: Call, raw: unknown): Promise<unknown> {
    const { descriptor, options, kind, ctx } = call;
    await this.optional(TenancyCheck)?.check(descriptor);
    if (kind === "action" && options.structural === true)
      await this.required(
        LiveConfigurationGuard,
        `${descriptor.key} changes structural configuration; bind a guard (@stackra/tenancy)`,
      ).check(descriptor);
    if (!options.actors.includes(descriptor.actor.kind)) throw ForbiddenError.create();
    await this.required(AccessControl, IAM).require(descriptor);
    const level = kind === "action" ? options.stepUp : undefined;
    if (level !== undefined)
      await this.required(
        StepUpCheck,
        `${descriptor.key} declares stepUp; bind a StepUpCheck driver over @stackra/identity's requireAssurance`,
      ).require(descriptor, call.request.assurance, level);
    if (kind === "action")
      for (const type of options.preconditions ?? []) await this.resolver.get(type).check(ctx);
    await this.optional(EntitlementCheck)?.check(descriptor);
    await this.optional(FlagCheck)?.check(descriptor);
    const input = this.validated(call, raw);
    const cursor = (input as { readonly cursor?: unknown } | null | undefined)?.cursor;
    if (kind === "query" && typeof cursor === "string") call.state.replicaCursor = cursor;
    return input;
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
   * Runs `work` for an action call replayed from a device's queue when its sequence is above the device's last settled
   * one, then settles it on an output or a refusal (a rejected call is settled too, so the next one may run). One at or
   * below the last settled may only replay its stored output (a resend after a lost response), which the idempotency
   * step enforces. A reused Idempotency-Key does not settle (the first call with it does), and any other error leaves
   * the sequence for a retry. Calls without a device sequence run as they are.
   */
  private async ordered(call: Call, work: () => Promise<unknown>): Promise<unknown> {
    const { device } = call.request;
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
      if (isRefusal(error) && !isRefusal(error, IdempotencyKeyReusedError)) await settle();
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
  ): Promise<{ readonly held: string } | { readonly replay: unknown } | undefined> {
    const policy = call.options.idempotency ?? Idempotency.Optional;
    const sent = call.request.idempotencyKey;
    if (sent === undefined && policy === Idempotency.Required)
      throw IdempotencyKeyRequiredError.create();
    if (sent === undefined && policy !== Idempotency.Derived) return undefined;
    const { descriptor } = call;
    const fingerprint = await fingerprintOf(descriptor.key, input);
    const key = sent ?? `derived:${fingerprint}`;
    call.state.idempotencyKey = key;
    const scoped = [descriptor.key, descriptor.scopeId ?? "-", descriptor.actor.id, key].join(":");
    const store = this.required(
      IdempotencyStore,
      `${descriptor.key} has an Idempotency-Key; bind a store (the memory driver ships with @stackra/actions)`,
    );
    const earlier = await store.claim(scoped, fingerprint, IDEMPOTENCY_TTL);
    if (earlier === undefined) return { held: scoped };
    if (!earlier.done || earlier.fingerprint !== fingerprint)
      throw IdempotencyKeyReusedError.create();
    return { replay: earlier.output };
  }

  /**
   * Takes a token from the area's bucket (plan-sized by `RateLimitBudget` when it answers, else `RateLimitConfig`)
   * and from the action's own, refusing when either is empty.
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
    const takes: [key: string, bucket: RateLimitBucket][] = [];
    const area = this.optional(RateLimitConfig)?.areas[descriptor.area];
    const planned = await this.optional(RateLimitBudget)?.areaBucket(descriptor);
    if (planned !== undefined) takes.push([`area:${descriptor.area}:${holder}`, planned]);
    else if (area !== undefined)
      takes.push([
        `area:${descriptor.area}:${holder}`,
        {
          capacity: area.burst,
          tokensPerSecond: area.requests / (Duration.toMilliseconds(area.per) / 1000),
        },
      ]);
    const own = options.rateLimit;
    if (own !== undefined) {
      const by = own.by ?? "principal";
      takes.push([
        `action:${descriptor.key}:${by}:${by === "tenant" ? holder : descriptor.actor.id}`,
        { capacity: own.perMinute, tokensPerSecond: own.perMinute / 60 },
      ]);
    }
    for (const [key, bucket] of takes)
      if (!(await store.take(key, bucket, at)).allowed) throw RateLimitedError.create();
  }

  /**
   * Runs the interceptors around `handle`, the first outermost. An action's `handle` runs in its unit of work with its
   * usage event and its success audit entry (so the entry commits or rolls back with the writes), and the unit of work
   * runs inside the limit reservation when one is bound (reserve, then commit).
   */
  private intercepted(call: Call, input: unknown): Promise<unknown> {
    const instance = this.resolver.get(call.type) as unknown as Handler;
    const handle = () => instance.handle(input, call.ctx);
    const accepts = call.kind === "action" ? call.options.accepts : undefined;
    const reviewed =
      accepts === undefined ? handle : () => this.reviewed(call, accepts, input, handle);
    const meter = call.kind === "action" ? call.options.meter : undefined;
    const run = async () => {
      const output = await reviewed();
      if (meter !== undefined) await this.metered(call, meter, input);
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
            const commit = () => (unit === undefined ? run() : unit.transaction(run));
            const reservation = this.optional(LimitReservation);
            return reservation === undefined
              ? commit()
              : reservation.reserve(call.descriptor, input, commit);
          }
        : handle;
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
    };
    return Object.freeze(action);
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
