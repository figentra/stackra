/**
 * Stackra file contract:
 * Purpose: the billing-shaped case (P-017) of the approval stage, built only from test fixtures: a coupon create action
 *          that declares a stage with a threshold condition reading a setting, one approver and the `financial` effect;
 *          a call under the threshold runs, one above it is parked, the requester cannot approve it, an approver can, and
 *          `ApprovalExecutor` then runs it once as the requester.
 * Boundary: test only. It needs the three-argument `ApprovalCondition.needed(input, ctx, settings)` and the
 *           `ApprovalSettingsSource` port of the stage's build branch; it builds no billing code.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0509; STA-1724 (P-017, FR-020).
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
  type VerifiedPrincipal,
} from "@stackra/contracts";
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
import { Effect } from "#contracts/enums/effect.enum";
import { ApprovalSettingsSource } from "#contracts/ports/approval-settings-source.port";
import { Action } from "#core/bases/action.base";
import { ApprovalCondition } from "#core/bases/approval-condition.base";
import { MemoryIdempotencyStoreDriver } from "#core/drivers/memory-idempotency-store.driver";
import { MemoryRateLimitStoreDriver } from "#core/drivers/memory-rate-limit-store.driver";
import { registerActions } from "#core/functions/register-actions.function";
import { ActionPipeline } from "#core/services/action-pipeline.service";
import type { ActionContext } from "#core/types/action-context.type";
import type { ApprovalSettingsReader } from "#core/types/approval-settings-reader.type";
import type { Resolver } from "#core/types/resolver.type";
import { ApprovalExecutor } from "#node/listeners/approval-executor.listener";
import { MemoryActorStatusCheckDriver } from "#testing/drivers/memory-actor-status-check.driver";
import { MemoryApprovalBindingStoreDriver } from "#testing/drivers/memory-approval-binding-store.driver";
import { MemoryApprovalGateDriver } from "#testing/drivers/memory-approval-gate.driver";

const NOW = new Date("2026-11-01T10:00:00.000Z");
const THRESHOLD = "billing.coupon.approvalThreshold";
const APPROVE = "billing.coupon.approve";

const requester: Actor = {
  kind: ActorKind.User,
  id: "usr_requester",
  realm: Realm.Staff,
  scopeId: "ten_1",
};

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

class FixedClock extends Clock {
  now(): Date {
    return new Date(NOW);
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

class Allow extends Driver(AccessControl) {
  async require(): Promise<void> {}

  async authorize(): Promise<void> {}
}

class PassThrough extends Driver(CallIsolation) {
  run<T>(_actor: Actor, _scope: unknown, work: () => Promise<T>): Promise<T> {
    return work();
  }
}

class Owns extends Driver(ScopeOwnership) {
  async holds(): Promise<boolean> {
    return true;
  }
}

class FromStore extends Driver(ApprovalGrantOrigin) {
  async trusts(): Promise<boolean> {
    return true;
  }
}

class Quiet extends Driver(Logger) {
  debug(): void {}

  info(): void {}

  warn(): void {}

  error(): void {}
}

/** The tenant's settings: coupons above 10 percent need a second approver. */
class Settings extends Driver(ApprovalSettingsSource) {
  async get(key: string): Promise<unknown> {
    return key === THRESHOLD ? 10 : undefined;
  }
}

/** The condition: the threshold is a setting, the comparison is code; no constructor dependencies. */
class CouponAboveThresholdCondition extends ApprovalCondition {
  static override readonly reads = [THRESHOLD] as const;

  async needed(
    input: { readonly percent: number },
    _ctx: ActionContext,
    settings: ApprovalSettingsReader,
  ): Promise<boolean> {
    return input.percent > Number(await settings.get(THRESHOLD));
  }
}

const created: number[] = [];

class CreateCouponAction extends Action({
  key: "coupon.create",
  actors: [ActorKind.User],
  approval: { permission: APPROVE, approvals: 1, when: CouponAboveThresholdCondition },
}) {
  async handle(input: { percent: number }): Promise<{ percent: number }> {
    created.push(input.percent);
    return { percent: input.percent };
  }
}

registerActions([
  { type: CreateCouponAction, key: "billing.coupon.create@1", effects: [Effect.Financial] },
]);

describe("a billing-shaped coupon create action with an approval stage", () => {
  it("runs below the threshold, parks above it, refuses self-approval, and executes once on grant", async () => {
    created.length = 0;
    const identity = new SilentIdentity();
    const gate = new MemoryApprovalGateDriver({ identity, clock: new FixedClock() });
    const bindings = new MemoryApprovalBindingStoreDriver();
    const map = new Map<AnyClass, object>([
      [Clock, new FixedClock()],
      [AccessControl, new Allow()],
      [ApprovalGate, gate],
      [ApprovalBindingStore, bindings],
      [ApprovalSettingsSource, new Settings()],
      [ActorStatusCheck, new MemoryActorStatusCheckDriver()],
      [IdentityResolver, identity],
      [IdempotencyStore, new MemoryIdempotencyStoreDriver(new FixedClock())],
      [RateLimitStore, new MemoryRateLimitStoreDriver()],
      [CallIsolation, new PassThrough()],
      [Logger, new Quiet()],
      [CouponAboveThresholdCondition, new CouponAboveThresholdCondition()],
      [CreateCouponAction, new CreateCouponAction()],
    ]);
    const resolver: Resolver = {
      has: (token) => map.has(token),
      get: <T extends object>(token: AnyClass<T>): T => map.get(token) as T,
    };
    const pipeline = new ActionPipeline(resolver);
    const executor = new ApprovalExecutor(
      gate,
      bindings,
      new FromStore(),
      new PassThrough(),
      new Owns(),
      new FixedClock(),
      new Quiet(),
    );
    executor.connect(resolver);

    // below the threshold: no approval
    await expect(
      pipeline.execute(CreateCouponAction, { percent: 5 }, { actor: requester }),
    ).resolves.toEqual({ percent: 5 });

    // above it: parked with one approver required
    const refused = await pipeline
      .execute(CreateCouponAction, { percent: 40 }, { actor: requester })
      .then(
        () => undefined,
        (error: unknown) =>
          error as { code: string; approvalId: string; approvalsRequired: number },
      );
    expect(refused).toMatchObject({ code: "approval_required", approvalsRequired: 1 });
    const approvalId = refused?.approvalId ?? "";
    expect(created).toEqual([5]);

    // the requester cannot approve their own coupon
    await expect(gate.approve(approvalId, { ...approver, actor: requester })).rejects.toMatchObject(
      { code: "self_approval" },
    );

    // a second person can; the grant executes the coupon once, as the requester
    await gate.approve(approvalId, approver);
    const event = ApprovalGranted.create({
      approvalId,
      key: "billing.coupon.create@1",
      service: "billing",
      scopeId: "ten_1",
    });
    const ctx: ListenerContext = {
      eventId: "evt_1",
      occurredAt: NOW,
      scopeId: "ten_1",
      now: () => NOW,
    };
    await executor.handle(event, ctx);
    await executor.handle(event, ctx);
    expect(created).toEqual([5, 40]);
    expect((await gate.find(approvalId))?.status).toBe("executed");
  });
});
