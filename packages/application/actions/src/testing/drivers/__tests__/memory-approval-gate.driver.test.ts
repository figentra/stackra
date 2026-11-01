/**
 * Stackra file contract:
 * Purpose: unit tests of `MemoryApprovalGateDriver`: it passes the port conformance suite, and its approve refuses the
 *          requester, an agent for the requester, the requester's other id, a repeat vote, an unpermitted approver, an
 *          operator-access vote, a customer-realm vote and a vote below the approver level; refuses after expiry with no
 *          sweep; records the voter's realm; refuses a vote while identity is down; re-checks every voter at the final
 *          vote (a lost permission or an inactive voter does not count); and answers `decide` from its rules.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0509; STA-1724 (P-008, P-020, P-021, P-022; EC-001, EC-009).
 */
import {
  type Actor,
  ActorKind,
  AssuranceLevel,
  Clock,
  IdentityResolver,
  type Email,
  mintPublicId,
  type PublicId,
  Realm,
  type VerifiedPrincipal,
} from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";

import { ApprovalExecution } from "#contracts/enums/approval-execution.enum";
import { ApprovalStatus } from "#contracts/enums/approval-status.enum";
import { ApprovalGate } from "#contracts/ports/approval-gate.port";
import type { ApprovalDraft } from "#contracts/types/approval-draft.type";
import { MemoryApprovalGateDriver } from "#testing/drivers/memory-approval-gate.driver";
import { describeApprovalGateConformance } from "#testing/functions/describe-approval-gate-conformance.function";
import type { MemoryApprover } from "#testing/types/memory-approver.type";

const PERMISSION = "billing.coupon.approve";

class TestClock extends Clock {
  at = new Date("2026-11-01T09:00:00.000Z");

  now(): Date {
    return new Date(this.at);
  }
}

class TestIdentity extends IdentityResolver {
  down = false;

  /** Sara's two ids share an email; everyone else has their own. */
  private readonly emails: Readonly<Record<string, Email>> = {
    usr_requester: "sara@acme.example",
    usr_requester_other: "sara@acme.example",
    usr_one: "one@acme.example",
    usr_two: "two@acme.example",
    usr_three: "three@acme.example",
  };

  async emailOf(id: PublicId<"usr">): Promise<Email> {
    return (await this.principalOf(id)).email;
  }

  async principalOf(id: PublicId<"usr">): Promise<VerifiedPrincipal> {
    if (this.down) throw new Error("identity is down");
    return { id, email: this.emails[id] ?? `${id}@unknown.example`, locale: "en" };
  }

  async principalByVerifiedEmail(): Promise<VerifiedPrincipal | null> {
    return null;
  }
}

const user = (id: `usr_${string}`, realm: Realm = Realm.Staff): Actor => ({
  kind: ActorKind.User,
  id,
  realm,
});
const requester = user("usr_requester");

const approverOf = (id: `usr_${string}`, extra: Partial<MemoryApprover> = {}): MemoryApprover => ({
  actor: user(id),
  realm: Realm.Staff,
  permissions: [PERMISSION],
  assurance: AssuranceLevel.Aal2,
  steppedUp: true,
  ...extra,
});

function setup(options: { cap?: number } = {}) {
  const clock = new TestClock();
  const identity = new TestIdentity();
  const gate = MemoryApprovalGateDriver.of({ identity, clock, ...options });
  return { clock, identity, gate };
}

/** A pending two-approver draft of a coupon update by the requester. */
function draft(overrides: Partial<ApprovalDraft> = {}): ApprovalDraft {
  return {
    approvalId: mintPublicId("apr"),
    key: "billing.coupon.update@1",
    scopeId: "tnt_1",
    requester,
    snapshot: { percent: 40 },
    requirement: { approvals: 2, permission: PERMISSION, expiresAfter: "72h" },
    expiresAt: new Date("2026-11-04T09:00:00.000Z"),
    execute: ApprovalExecution.OnGrant,
    ...overrides,
  };
}

describeApprovalGateConformance("MemoryApprovalGateDriver", () => {
  const { gate } = setup({ cap: 3 });
  const one = approverOf("usr_one");
  return {
    gate,
    cap: 3,
    // the conformance drafts need one approval
    grant: (id) => gate.approve(id, one),
    reject: (id) => gate.reject(id, one),
    withdraw: async (id) => {
      const record = await gate.find(id);
      if (record === undefined) throw new Error("no such request");
      await gate.withdraw(id, record.requester);
    },
  };
});

describe(MemoryApprovalGateDriver, () => {
  it("is an ApprovalGate and answers decide from its rules", async () => {
    const identity = new TestIdentity();
    const gate = MemoryApprovalGateDriver.of({
      identity,
      clock: new TestClock(),
      decide: () => ({ approvals: 3, expiresAfter: "24h" }),
    });
    expect(gate).toBeInstanceOf(ApprovalGate);
    await expect(gate.decide({} as never, {}, undefined)).resolves.toEqual({
      approvals: 3,
      expiresAfter: "24h",
    });
    await expect(setup().gate.decide({} as never, {}, undefined)).resolves.toBeUndefined();
  });

  it("grants at the second distinct approver and records each voter's realm", async () => {
    const { gate } = setup();
    const request = draft();
    await gate.park(request);
    await gate.approve(request.approvalId, approverOf("usr_one"));
    expect((await gate.find(request.approvalId))?.status).toBe(ApprovalStatus.Pending);
    await gate.approve(request.approvalId, approverOf("usr_two"));
    const record = await gate.find(request.approvalId);
    expect(record?.status).toBe(ApprovalStatus.Granted);
    expect(record?.grantedAt).toEqual(new Date("2026-11-01T09:00:00.000Z"));
    expect(record?.votes.map((vote) => [vote.voter.id, vote.realm])).toEqual([
      ["usr_one", Realm.Staff],
      ["usr_two", Realm.Staff],
    ]);
    expect(gate.granted).toEqual([request.approvalId]);
  });

  it("refuses the requester, an agent acting for them, and their other id (self_approval)", async () => {
    const { gate } = setup();
    const request = draft();
    await gate.park(request);
    const agent: MemoryApprover = {
      ...approverOf("usr_one"),
      actor: { kind: ActorKind.Agent, id: "agt_1", onBehalfOf: requester },
    };
    for (const voter of [
      approverOf("usr_requester"),
      approverOf("usr_requester_other"), // same verified email: the interim person rule (EC-009)
    ])
      await expect(gate.approve(request.approvalId, voter)).rejects.toMatchObject({
        refusal: "self_approval",
      });
    // an agent never approves: a non-user actor is forbidden before any other check
    await expect(gate.approve(request.approvalId, agent)).rejects.toMatchObject({
      code: "forbidden",
    });
    expect((await gate.find(request.approvalId))?.votes).toEqual([]);
  });

  it("refuses a second vote by the same person (already_approved)", async () => {
    const { gate } = setup();
    const request = draft();
    await gate.park(request);
    await gate.approve(request.approvalId, approverOf("usr_one"));
    await expect(gate.approve(request.approvalId, approverOf("usr_one"))).rejects.toMatchObject({
      refusal: "already_approved",
    });
    expect((await gate.find(request.approvalId))?.votes).toHaveLength(1);
  });

  it("refuses an unpermitted approver, a low assurance level and a missing step-up", async () => {
    const { gate } = setup();
    const request = draft({
      requirement: {
        approvals: 1,
        permission: PERMISSION,
        expiresAfter: "72h",
        approverLevel: AssuranceLevel.Aal2,
      },
    });
    await gate.park(request);
    await expect(
      gate.approve(request.approvalId, approverOf("usr_one", { permissions: [] })),
    ).rejects.toMatchObject({ refusal: "approver_not_permitted" });
    await expect(
      gate.approve(request.approvalId, approverOf("usr_one", { assurance: AssuranceLevel.Aal1 })),
    ).rejects.toMatchObject({ refusal: "step_up_required" });
    await expect(
      gate.approve(request.approvalId, approverOf("usr_one", { assurance: undefined })),
    ).rejects.toMatchObject({ refusal: "step_up_required" });
  });

  it("refuses an operator-access vote and a customer-realm vote (forbidden)", async () => {
    const { gate } = setup();
    const request = draft();
    await gate.park(request);
    await expect(
      gate.approve(request.approvalId, approverOf("usr_one", { operatorAccess: true })),
    ).rejects.toMatchObject({ code: "forbidden" });
    await expect(
      gate.approve(request.approvalId, approverOf("usr_one", { realm: Realm.Customer })),
    ).rejects.toMatchObject({ code: "forbidden" });
  });

  it("refuses a vote after expiresAt with the sweep never run, then the sweep marks it expired", async () => {
    const { gate, clock } = setup();
    const request = draft();
    await gate.park(request);
    clock.at = new Date("2026-11-05T09:00:00.000Z");
    await expect(gate.approve(request.approvalId, approverOf("usr_one"))).rejects.toMatchObject({
      code: "approval_expired",
    });
    expect((await gate.find(request.approvalId))?.status).toBe(ApprovalStatus.Expired);
    expect((await gate.find(request.approvalId))?.snapshot).toBeUndefined();
  });

  it("refuses a vote while identity cannot answer, and counts nothing", async () => {
    const { gate, identity } = setup();
    const request = draft();
    await gate.park(request);
    identity.down = true;
    await expect(gate.approve(request.approvalId, approverOf("usr_one"))).rejects.toMatchObject({
      code: "approval_identity_unavailable",
    });
    expect((await gate.find(request.approvalId))?.votes).toEqual([]);
  });

  it("does not count a voter who lost the permission or went inactive before the final vote (EC-001)", async () => {
    const { gate } = setup();
    const request = draft();
    await gate.park(request);
    await gate.approve(request.approvalId, approverOf("usr_one"));
    gate.directory.set("usr_one", approverOf("usr_one", { permissions: [] }));
    await gate.approve(request.approvalId, approverOf("usr_two"));
    const waiting = await gate.find(request.approvalId);
    expect(waiting?.status).toBe(ApprovalStatus.Pending);
    expect(waiting?.votes.map((vote) => vote.voter.id)).toEqual(["usr_two"]);
    // a third approver completes it
    await gate.approve(request.approvalId, approverOf("usr_three"));
    expect((await gate.find(request.approvalId))?.status).toBe(ApprovalStatus.Granted);

    const second = draft();
    await gate.park(second);
    await gate.approve(second.approvalId, approverOf("usr_one"));
    gate.directory.set("usr_one", approverOf("usr_one", { active: false }));
    await gate.approve(second.approvalId, approverOf("usr_two"));
    expect((await gate.find(second.approvalId))?.status).toBe(ApprovalStatus.Pending);
  });

  it("withdraws only for the requester and the sweep expires overdue requests", async () => {
    const { gate, clock } = setup();
    const request = draft();
    await gate.park(request);
    await expect(gate.withdraw(request.approvalId, user("usr_one"))).rejects.toMatchObject({
      code: "forbidden",
    });
    await gate.withdraw(request.approvalId, requester);
    const other = draft();
    await gate.park(other);
    clock.at = new Date("2026-12-01T00:00:00.000Z");
    gate.sweep();
    expect((await gate.find(other.approvalId))?.status).toBe(ApprovalStatus.Expired);
  });
});
