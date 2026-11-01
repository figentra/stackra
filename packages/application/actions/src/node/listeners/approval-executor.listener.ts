/**
 * Stackra file contract:
 * Purpose: `ApprovalExecutor`, the listener in the service that owns a declared action: on `approval.granted` it runs the
 *          parked call as the stored requester, once, and settles the request with how it ended.
 * Boundary: acts only on a delivery `ApprovalGrantOrigin` trusts, for the event's own tenant, and never lets the inbox's
 *           actor reach a call: the binding is read in a `CallIsolation.run` for that tenant as the scope's system actor
 *           (never a platform read, never `BYPASSRLS`), and the call is built only from the binding (actor and chain,
 *           scope, key, assurance); the store supplies status, votes and the input snapshot, and the snapshot must hash to
 *           the binding's `inputHash`. `ScopeOwnership` must hold for the stored actor and scope. `begin` moves the
 *           request `granted → executing` by compare-and-set, then `ActionPipeline.execute` opens its own fresh isolation
 *           run as the binding's actor with `approvalId` set, so the key is forced to `approval:<id>` and the whole
 *           pipeline re-checks permission, preconditions, entitlement and flag. `settle` is a compare-and-set. A refusal
 *           settles `failed` with its code, except the in-flight answers (`idempotency_key_reused`, `approval_consumed`),
 *           which settle nothing, and a retryable refusal (an identity outage), which is rethrown for the retry and leaves
 *           the request `executing`; an error that is not a refusal is rethrown the same way. A request still `executing`
 *           24 hours after its grant settles `unknown` and is never retried. A delivery it cannot place (an action this
 *           service does not own, a tenant with no binding) is dropped and logged by id only. Runs after commit like every
 *           listener, on a worker queue with retries. Call `connect(resolver)` once the container is booted.
 * Runtime: node
 * Governing contract: ADR 0509 (decision 7); ADR 0495 (decisions 1 and 2); ADR 0360 (decision 9); ADR 0141;
 *                     STA-1724 FR-011, FR-012.
 */
import { Duration, ActorKind } from "@stackra/contracts";
import type { Actor, Clock, Logger, PublicId } from "@stackra/contracts";
import { type ListenerContext, Listener } from "@stackra/events";
import { isRefusal } from "@stackra/errors";

import type { ApprovalGranted } from "#contracts/events/approval-granted.event";
import { ApprovalExecution } from "#contracts/enums/approval-execution.enum";
import { ApprovalStatus } from "#contracts/enums/approval-status.enum";
import type { ApprovalBindingStore } from "#contracts/ports/approval-binding-store.port";
import type { ApprovalGate } from "#contracts/ports/approval-gate.port";
import type { ApprovalGrantOrigin } from "#contracts/ports/approval-grant-origin.port";
import type { CallIsolation } from "#contracts/ports/call-isolation.port";
import type { ScopeOwnership } from "#contracts/ports/scope-ownership.port";
import type { ApprovalBinding } from "#contracts/types/approval-binding.type";
import type { ApprovalRecord } from "#contracts/types/approval-record.type";
import { ACTION_REGISTRY } from "#core/constants/action-registry.constant";
import { IDEMPOTENCY_TTL } from "#core/constants/idempotency-ttl.constant";
import { ApprovalMismatchError } from "#core/errors/approval-mismatch.error";
import { ApprovalNotGrantedError } from "#core/errors/approval-not-granted.error";
import { fingerprintOf } from "#core/functions/fingerprint-of.function";
import { ActionPipeline } from "#core/services/action-pipeline.service";
import type { Resolver } from "#core/types/resolver.type";

/** The system actor that reads a tenant's binding: the executor, acting in the tenant of the event only. */
const EXECUTOR_ACTOR_ID = "sys_approval_executor";

/** Answers that mean "another run holds it", which never settle `failed`. */
const IN_FLIGHT: ReadonlySet<string> = new Set(["idempotency_key_reused", "approval_consumed"]);

/** What the executor writes to the log: ids only, never input, voters or the hash. */
const LOG = {
  dropped: "approval.executor.dropped",
  unknown: "approval.executor.unknown",
} as const;

/**
 * Runs a granted approval as its requester.
 *
 * @example
 * // the generated subscription of the owning service delivers each approval.granted envelope here
 * await executor.handle(ApprovalGranted.create({ approvalId, key: "coupon.update@1", service: "billing", scopeId }), ctx);
 */
export class ApprovalExecutor extends Listener({
  queue: "default",
  retry: { attempts: 8, base: Duration.seconds(30), max: Duration.minutes(30) },
}) {
  /** Reads, begins and settles the store's requests. */
  private readonly gate: ApprovalGate;

  /** Reads the owning service's bindings. */
  private readonly bindings: ApprovalBindingStore;

  /** Whether a delivery came from the store's service. */
  private readonly origin: ApprovalGrantOrigin;

  /** Opens the tenant-scoped read of the binding. */
  private readonly isolation: CallIsolation;

  /** Whether the stored actor owns the stored scope. */
  private readonly ownership: ScopeOwnership;

  /** The owning service's clock. */
  private readonly clock: Clock;

  /** The log. */
  private readonly logger: Logger;

  /** Set by `connect`. */
  private resolver: Resolver | undefined;

  /**
   * @param gate - the store's port.
   * @param bindings - the owning service's binding store.
   * @param origin - the check that a delivery came from the store's service.
   * @param isolation - the isolation port.
   * @param ownership - the scope-owner check.
   * @param clock - the owning service's clock.
   * @param logger - the log.
   */
  constructor(
    gate: ApprovalGate,
    bindings: ApprovalBindingStore,
    origin: ApprovalGrantOrigin,
    isolation: CallIsolation,
    ownership: ScopeOwnership,
    clock: Clock,
    logger: Logger,
  ) {
    super();
    this.gate = gate;
    this.bindings = bindings;
    this.origin = origin;
    this.isolation = isolation;
    this.ownership = ownership;
    this.clock = clock;
    this.logger = logger;
  }

  /** Runs the executions on the pipeline of `resolver` (a booted container or a testing app). */
  connect(resolver: Resolver): void {
    this.resolver = resolver;
  }

  /**
   * Executes the granted request `event` names, once.
   *
   * @throws ApprovalMismatchError when the stored actor does not own its scope, or the store's row or snapshot does not
   *         fit the binding; ApprovalNotGrantedError when the request is still pending; a retryable refusal or any
   *         error that is not a refusal, which leaves the request `executing` for the retry.
   * @throws Error before `connect`.
   */
  async handle(event: ApprovalGranted, ctx: ListenerContext): Promise<void> {
    const resolver = this.resolver;
    if (resolver === undefined)
      throw new Error("ApprovalExecutor is not connected: call connect(container) after boot");
    const { approvalId, key } = event;
    if (
      !(await this.origin.trusts(ctx)) ||
      ctx.scopeId === undefined ||
      ctx.scopeId !== event.scopeId
    )
      return this.drop(approvalId, "origin");
    const type = this.typeOf(key);
    if (type === undefined) return this.drop(approvalId, "key");

    // run one: the binding, read as the tenant's system actor and never as a platform read
    const system: Actor = Object.freeze({
      kind: ActorKind.System,
      id: EXECUTOR_ACTOR_ID as PublicId,
      scopeId: ctx.scopeId as PublicId,
    });
    const binding = await this.isolation.run(
      system,
      undefined,
      () => this.bindings.find(approvalId),
      { readOnly: true },
    );
    if (binding === undefined || binding.key !== key || binding.scopeId !== ctx.scopeId)
      return this.drop(approvalId, "binding");
    if (binding.execute !== ApprovalExecution.OnGrant) return this.drop(approvalId, "mode");
    if (!(await this.ownership.holds(binding.requester, binding.scope)))
      throw ApprovalMismatchError.create();

    const record = await this.gate.find(approvalId);
    if (record === undefined) throw ApprovalMismatchError.create();
    const executionKey = `approval:${approvalId}`;
    const proceed = await this.ready(binding, record, executionKey);
    if (!proceed) return;
    if (!(await this.gate.begin(approvalId, executionKey))) return;

    // run two: the pipeline opens its own fresh isolation run as the binding's actor
    const pipeline = resolver.has(ActionPipeline)
      ? resolver.get(ActionPipeline)
      : new ActionPipeline(resolver);
    try {
      await pipeline.execute(type as never, record.snapshot as never, {
        actor: binding.requester,
        ...(binding.scope === undefined ? {} : { scope: binding.scope }),
        callId: executionKey,
        idempotencyKey: executionKey,
        approvalId,
        ...(binding.assurance === undefined ? {} : { assurance: binding.assurance }),
      });
    } catch (error) {
      if (!isRefusal(error) || error.retryable) throw error;
      if (IN_FLIGHT.has(error.code)) return;
      await this.gate.settle(approvalId, { status: "failed", code: error.code });
      return;
    }
    await this.gate.settle(approvalId, { status: "executed" });
  }

  /**
   * Whether the request may begin: a granted one, or an `executing` one that is this execution's own retry. A stuck
   * `executing` one past its window settles `unknown`; a final one has nothing to do.
   *
   * @throws ApprovalMismatchError when the row or its snapshot differs from the binding.
   * @throws ApprovalNotGrantedError when the request is still pending.
   */
  private async ready(
    binding: ApprovalBinding,
    record: ApprovalRecord,
    executionKey: string,
  ): Promise<boolean> {
    if (
      record.approvalId !== binding.approvalId ||
      record.key !== binding.key ||
      record.scopeId !== binding.scopeId ||
      record.requester.id !== binding.requester.id ||
      record.execute !== binding.execute
    )
      throw ApprovalMismatchError.create();
    switch (record.status) {
      case ApprovalStatus.Pending: {
        throw ApprovalNotGrantedError.create();
      }
      case ApprovalStatus.Granted: {
        break;
      }
      case ApprovalStatus.Executing: {
        if (record.executionKey !== executionKey) return false;
        if (
          record.grantedAt !== undefined &&
          this.clock.now().getTime() >
            record.grantedAt.getTime() + Duration.toMilliseconds(IDEMPOTENCY_TTL)
        ) {
          await this.gate.settle(binding.approvalId, { status: "unknown" });
          this.logger.warn(LOG.unknown, { approvalId: binding.approvalId, key: binding.key });
          return false;
        }
        break;
      }
      default: {
        return false;
      }
    }
    // the store's snapshot must be the input the binding hashed (B1)
    if (
      record.snapshot === undefined ||
      (await fingerprintOf(binding.key, record.snapshot)) !== binding.inputHash
    )
      throw ApprovalMismatchError.create();
    return true;
  }

  /** The action class this service registered under `key`, when it owns it. */
  private typeOf(key: string) {
    for (const [type, registration] of ACTION_REGISTRY) if (registration.key === key) return type;
    return undefined;
  }

  /** Drops a delivery this service cannot place, logging ids only. */
  private drop(approvalId: string, reason: string): void {
    this.logger.warn(LOG.dropped, { approvalId, reason });
  }
}
