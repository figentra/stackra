/**
 * Stackra file contract:
 * Purpose: unit tests of `ApprovalExecutor` over the memory gate and binding store and the real `ActionPipeline`: a grant
 *          runs the call once as the stored requester and settles `executed`; the binding is read as the tenant's system
 *          actor in a read-only run and the call runs in a fresh run as the binding's actor; a duplicate and a
 *          concurrent delivery run `handle` once; an untrusted origin, a tenant mismatch, an unknown key, a missing
 *          binding and an `on_resubmit` request are dropped; a scope the actor does not own and a tampered snapshot are
 *          refused `approval_mismatch` before `begin`; a refused execution settles `failed` with its code; an in-flight
 *          answer, an identity outage and an error that is not a refusal never settle `failed` and leave a retry that
 *          succeeds; a request stuck `executing` past 24 hours settles `unknown`.
 * Boundary: test only; every port is a memory driver or a recording stand-in.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0509 (decision 7); STA-1724 (P-009, P-010, P-015, P-019, P-022).
 */
import { Driver } from "@stackra/container";
import type { AnyClass } from "@stackra/container";
import {
  type Actor,
  ActorKind,
  AssuranceLevel,
  Clock,
  type Email,
  IdentityResolver,
  Logger,
  type PublicId,
  Realm,
  type ScopeRef,
  type VerifiedPrincipal,
} from "@stackra/contracts";
import { ForbiddenError, IdempotencyKeyReusedError } from "@stackra/errors";
import type { ListenerContext } from "@stackra/events";
import { describe, expect, it } from "@stackra/testing";

import {
  AccessControl,
  ActorStatusCheck,
  ApprovalBindingStore,
  ApprovalGate,
  ApprovalGrantOrigin,
  ApprovalGranted,
  CallIsolation,
  IdempotencyStore,
  RateLimitStore,
  ScopeOwnership,
} from "#contracts/index";
import type { ApprovalRecord, CallDescriptor } from "#contracts/index";
import { Action } from "#core/bases/action.base";
import { MemoryIdempotencyStoreDriver } from "#core/drivers/memory-idempotency-store.driver";
import { MemoryRateLimitStoreDriver } from "#core/drivers/memory-rate-limit-store.driver";
import { ApprovalConsumedError } from "#core/errors/approval-consumed.error";
import { registerActions } from "#core/functions/register-actions.function";
import { ActionPipeline } from "#core/services/action-pipeline.service";
import type { Resolver } from "#core/types/resolver.type";
import { ApprovalExecutor } from "#node/listeners/approval-executor.listener";
import { MemoryActorStatusCheckDriver } from "#testing/drivers/memory-actor-status-check.driver";
import { MemoryApprovalBindingStoreDriver } from "#testing/drivers/memory-approval-binding-store.driver";
import { MemoryApprovalGateDriver } from "#testing/drivers/memory-approval-gate.driver";

const NOW = new Date("2026-11-01T10:00:00.000Z");
const APPROVE = "billing.coupon.approve";
const KEY = "billing.coupon.create@1";
const RESUBMIT_KEY = "billing.coupon.resubmit@1";
const SCOPE: ScopeRef = { id: "scp_01j9z3k4m5n6p7q8r9s0t1v2w1", path: "platform.acme" };

const requester: Actor = {
  kind: ActorKind.User,
  id: "usr_requester",
  realm: Realm.Staff,
  scopeId: "ten_1",
};

class ClockAt extends Clock {
  private readonly at: Date;

  constructor(at: Date) {
    super();
    this.at = at;
  }

  now(): Date {
    return new Date(this.at);
  }
}

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

class Access extends Driver(AccessControl) {
  readonly calls: CallDescriptor[] = [];

  denied = false;

  async require(call: CallDescriptor): Promise<void> {
    this.calls.push(call);
    if (this.denied) throw ForbiddenError.create();
  }

  async authorize(): Promise<void> {}
}

interface Run {
  readonly actor: Actor;
  readonly scope: ScopeRef | readonly ScopeRef[] | undefined;
  readonly readOnly: boolean;
}

class Isolation extends Driver(CallIsolation) {
  readonly runs: Run[] = [];

  async run<T>(
    actor: Actor,
    scope: ScopeRef | readonly ScopeRef[] | undefined,
    work: () => Promise<T>,
    options: { readonly readOnly: boolean },
  ): Promise<T> {
    this.runs.push({ actor, scope, readOnly: options.readOnly });
    return work();
  }
}

class Ownership extends Driver(ScopeOwnership) {
  owns = true;

  async holds(): Promise<boolean> {
    return this.owns;
  }
}

class Origin extends Driver(ApprovalGrantOrigin) {
  trusted = true;

  async trusts(): Promise<boolean> {
    return this.trusted;
  }
}

class Lines extends Driver(Logger) {
  readonly warnings: [string, Readonly<Record<string, unknown>> | undefined][] = [];

  debug(): void {}

  info(): void {}

  warn(event: string, fields?: Readonly<Record<string, unknown>>): void {
    this.warnings.push([event, fields]);
  }

  error(): void {}
}

/** A store whose answers a test may tamper with, as a writer of the store's table could. */
class TamperedGate extends MemoryApprovalGateDriver {
  tamper: ((record: ApprovalRecord) => ApprovalRecord) | undefined;

  override async find(approvalId: string): Promise<ApprovalRecord | undefined> {
    const record = await super.find(approvalId);
    return record !== undefined && this.tamper !== undefined ? this.tamper(record) : record;
  }
}

/** What the next execution of the coupon action does. */
const behaviour: { handled: unknown[]; next: (() => Promise<void>) | undefined } = {
  handled: [],
  next: undefined,
};

class CouponCreateAction extends Action({
  key: "coupon.create",
  actors: [ActorKind.User],
  approval: { permission: APPROVE },
}) {
  async handle(input: { percent: number }): Promise<{ percent: number }> {
    await behaviour.next?.();
    behaviour.handled.push(input);
    return { percent: input.percent };
  }
}

/** Parked only by the tenant's rules, so its request is resubmitted by the requester, never executed on grant. */
class ResubmitAction extends Action({
  key: "coupon.resubmit",
  actors: [ActorKind.User],
  approval: true,
}) {
  async handle(): Promise<string> {
    behaviour.handled.push("resubmit");
    return "ok";
  }
}

registerActions([
  { type: CouponCreateAction, key: KEY },
  { type: ResubmitAction, key: RESUBMIT_KEY },
]);

const approver = {
  actor: {
    kind: ActorKind.User,
    id: "usr_approver",
    realm: Realm.Staff,
    scopeId: "ten_1",
  } as Actor,
  realm: Realm.Staff,
  permissions: [APPROVE],
  assurance: AssuranceLevel.Aal2,
  steppedUp: true,
};

/** The delivery's metadata; `null` is a platform event with no tenant. */
const ctxOf = (scopeId: string | null = "ten_1"): ListenerContext => ({
  eventId: "evt_1",
  occurredAt: NOW,
  ...(scopeId === null ? {} : { scopeId }),
  now: () => NOW,
});

/** Everything bound over the memory drivers: the pipeline's resolver and the executor on it. */
function build(executorClock: Date = NOW) {
  behaviour.handled = [];
  behaviour.next = undefined;
  const identity = new SilentIdentity();
  const gate = new TamperedGate({
    identity,
    clock: new ClockAt(NOW),
    decide: (call) =>
      call.key === RESUBMIT_KEY ? { approvals: 1, expiresAfter: "72h" } : undefined,
  });
  const bindings = new MemoryApprovalBindingStoreDriver();
  const actors = new MemoryActorStatusCheckDriver();
  const access = new Access();
  const isolation = new Isolation();
  const ownership = new Ownership();
  const origin = new Origin();
  const lines = new Lines();
  const entries: [AnyClass, object][] = [
    [Clock, new ClockAt(NOW)],
    [AccessControl, access],
    [ApprovalGate, gate],
    [ApprovalBindingStore, bindings],
    [ActorStatusCheck, actors],
    [IdentityResolver, identity],
    [IdempotencyStore, new MemoryIdempotencyStoreDriver(new ClockAt(NOW))],
    [RateLimitStore, new MemoryRateLimitStoreDriver()],
    [CallIsolation, isolation],
    [Logger, lines],
    [CouponCreateAction, new CouponCreateAction()],
    [ResubmitAction, new ResubmitAction()],
  ];
  const map = new Map<AnyClass, object>(entries);
  const resolver: Resolver = {
    has: (token) => map.has(token),
    get: <T extends object>(token: AnyClass<T>): T => map.get(token) as T,
  };
  const pipeline = new ActionPipeline(resolver);
  const executor = new ApprovalExecutor(
    gate,
    bindings,
    origin,
    isolation,
    ownership,
    new ClockAt(executorClock),
    lines,
  );
  executor.connect(resolver);
  return {
    pipeline,
    executor,
    gate,
    bindings,
    actors,
    access,
    isolation,
    ownership,
    origin,
    lines,
  };
}

type Built = ReturnType<typeof build>;

/** Requests approval, has `approver` vote, and resolves to the id and the grant event. */
async function granted(
  built: Built,
  type: AnyClass = CouponCreateAction,
  key: string = KEY,
): Promise<{ approvalId: string; event: ApprovalGranted }> {
  const refused = await built.pipeline
    .execute(type as never, { percent: 40 } as never, { actor: requester, scope: SCOPE })
    .then(
      () => undefined,
      (error: unknown) => error as { code: string; approvalId: string },
    );
  expect(refused?.code).toBe("approval_required");
  const approvalId = refused?.approvalId ?? "";
  await built.gate.approve(approvalId, approver);
  expect(built.gate.granted).toContain(approvalId);
  return {
    approvalId,
    event: ApprovalGranted.create({ approvalId, key, service: "billing", scopeId: "ten_1" }),
  };
}

const statusOf = async (built: Built, approvalId: string) =>
  (await built.gate.find(approvalId))?.status;

describe(ApprovalExecutor, () => {
  it("runs the granted call once as the stored requester and settles executed", async () => {
    const built = build();
    const { approvalId, event } = await granted(built);
    built.isolation.runs.length = 0;
    built.access.calls.length = 0;
    await built.executor.handle(event, ctxOf());
    expect(behaviour.handled).toEqual([{ percent: 40 }]);
    expect(await statusOf(built, approvalId)).toBe("executed");
    // run one reads the binding as the tenant's system actor, read-only; run two is the call as the requester
    expect(built.isolation.runs[0]).toMatchObject({
      actor: { kind: ActorKind.System, id: "sys_approval_executor", scopeId: "ten_1" },
      scope: undefined,
      readOnly: true,
    });
    expect(built.isolation.runs[1]).toMatchObject({
      actor: { id: "usr_requester" },
      scope: SCOPE,
      readOnly: false,
    });
    // permission ran for the requester, never for the approver or the system actor
    expect(built.access.calls.map((call) => call.actor.id)).toEqual(["usr_requester"]);
    expect(built.access.calls[0]?.key).toBe(KEY);
  });

  it("runs once for a duplicate delivery and for two concurrent deliveries", async () => {
    const built = build();
    const { approvalId, event } = await granted(built);
    await Promise.all([
      built.executor.handle(event, ctxOf()),
      built.executor.handle(event, ctxOf()),
    ]);
    await built.executor.handle(event, ctxOf());
    expect(behaviour.handled).toHaveLength(1);
    expect(await built.gate.find(approvalId)).toMatchObject({ status: "executed" });
  });

  it("drops a delivery from an untrusted origin, for another tenant, for an unknown key or without a binding", async () => {
    const built = build();
    const { approvalId, event } = await granted(built);
    built.origin.trusted = false;
    await built.executor.handle(event, ctxOf());
    built.origin.trusted = true;
    await built.executor.handle(event, ctxOf("ten_2"));
    await built.executor.handle(event, ctxOf(null));
    await built.executor.handle(
      ApprovalGranted.create({
        approvalId,
        key: "billing.coupon.other@1",
        service: "billing",
        scopeId: "ten_1",
      }),
      ctxOf(),
    );
    await built.executor.handle(
      ApprovalGranted.create({
        approvalId: "apr_none",
        key: KEY,
        service: "billing",
        scopeId: "ten_1",
      }),
      ctxOf(),
    );
    expect(behaviour.handled).toEqual([]);
    expect(await statusOf(built, approvalId)).toBe("granted");
    expect(built.lines.warnings.map(([, fields]) => fields?.reason)).toEqual([
      "origin",
      "origin",
      "origin",
      "key",
      "binding",
    ]);
  });

  it("drops the grant of an on_resubmit request, which the requester resubmits", async () => {
    const built = build();
    const { approvalId, event } = await granted(built, ResubmitAction, RESUBMIT_KEY);
    await built.executor.handle(event, ctxOf());
    expect(behaviour.handled).toEqual([]);
    expect(await statusOf(built, approvalId)).toBe("granted");
  });

  it("refuses approval_mismatch, before begin, when the actor does not own the scope", async () => {
    const built = build();
    const { approvalId, event } = await granted(built);
    built.ownership.owns = false;
    await expect(built.executor.handle(event, ctxOf())).rejects.toMatchObject({
      code: "approval_mismatch",
    });
    expect(behaviour.handled).toEqual([]);
    expect(await statusOf(built, approvalId)).toBe("granted");
  });

  it("refuses approval_mismatch, before begin, for a snapshot that does not hash to the binding or a row of another key", async () => {
    const built = build();
    const { approvalId, event } = await granted(built);
    built.gate.tamper = (record) => ({ ...record, snapshot: { percent: 99 } });
    await expect(built.executor.handle(event, ctxOf())).rejects.toMatchObject({
      code: "approval_mismatch",
    });
    built.gate.tamper = (record) => ({ ...record, key: "billing.coupon.other@1" });
    await expect(built.executor.handle(event, ctxOf())).rejects.toMatchObject({
      code: "approval_mismatch",
    });
    expect(behaviour.handled).toEqual([]);
    expect(await statusOf(built, approvalId)).toBe("granted");
  });

  it("settles failed with the code of a refused execution, which is final", async () => {
    const built = build();
    const { approvalId, event } = await granted(built);
    built.access.denied = true;
    await built.executor.handle(event, ctxOf());
    expect(await built.gate.find(approvalId)).toMatchObject({
      status: "failed",
      failureCode: "forbidden",
    });
    built.access.denied = false;
    await built.executor.handle(event, ctxOf());
    expect(behaviour.handled).toEqual([]);
  });

  it("never settles failed on an in-flight answer, and leaves the request executing", async () => {
    for (const inFlight of [IdempotencyKeyReusedError, ApprovalConsumedError]) {
      const built = build();
      const { approvalId, event } = await granted(built);
      behaviour.next = async () => {
        throw inFlight.create();
      };
      await expect(built.executor.handle(event, ctxOf())).resolves.toBeUndefined();
      expect(await statusOf(built, approvalId)).toBe("executing");
    }
  });

  it("leaves the request executing on an identity outage, and a redelivery then runs it", async () => {
    const built = build();
    const { approvalId, event } = await granted(built);
    built.actors.setOutage(true);
    await expect(built.executor.handle(event, ctxOf())).rejects.toMatchObject({
      code: "approval_identity_unavailable",
    });
    expect(await statusOf(built, approvalId)).toBe("executing");
    expect(behaviour.handled).toEqual([]);
    built.actors.setOutage(false);
    await built.executor.handle(event, ctxOf());
    expect(behaviour.handled).toEqual([{ percent: 40 }]);
    expect(await statusOf(built, approvalId)).toBe("executed");
  });

  it("rethrows an error that is not a refusal, leaving the request executing for a retry with the same key", async () => {
    const built = build();
    const { approvalId, event } = await granted(built);
    behaviour.next = async () => {
      throw new TypeError("the database dropped the connection");
    };
    await expect(built.executor.handle(event, ctxOf())).rejects.toThrow(TypeError);
    expect(await statusOf(built, approvalId)).toBe("executing");
    behaviour.next = undefined;
    await built.executor.handle(event, ctxOf());
    expect(behaviour.handled).toEqual([{ percent: 40 }]);
    expect(await statusOf(built, approvalId)).toBe("executed");
  });

  it("settles a request still executing 24 hours after its grant unknown, and never runs it", async () => {
    const built = build(new Date(NOW.getTime() + 25 * 3_600_000));
    const { approvalId, event } = await granted(built);
    await built.gate.begin(approvalId, `approval:${approvalId}`);
    await built.executor.handle(event, ctxOf());
    expect(await statusOf(built, approvalId)).toBe("unknown");
    expect(behaviour.handled).toEqual([]);
    expect(built.lines.warnings.at(-1)?.[0]).toBe("approval.executor.unknown");
  });

  it("leaves a request another execution key holds alone", async () => {
    const built = build();
    const { approvalId, event } = await granted(built);
    await built.gate.begin(approvalId, "approval:other");
    await built.executor.handle(event, ctxOf());
    expect(behaviour.handled).toEqual([]);
    expect(await statusOf(built, approvalId)).toBe("executing");
  });

  it("refuses to run before it is connected", async () => {
    const built = build();
    const { event } = await granted(built);
    const loose = new ApprovalExecutor(
      built.gate,
      built.bindings,
      built.origin,
      built.isolation,
      built.ownership,
      new ClockAt(NOW),
      built.lines,
    );
    await expect(loose.handle(event, ctxOf())).rejects.toThrow(/not connected/);
  });
});
