/**
 * Stackra file contract:
 * Purpose: unit tests of `verifyApproval`: a granted-and-executing request with enough distinct people passes; each
 *          mismatch of the call with the binding (tenant, scope, requester chain, key, hash), each tampered store row
 *          (id, key, tenant, scope, requester, execute mode, snapshot), each status, the windows, the votes (too few,
 *          the same person twice, the requester's person, customer-realm and non-user votes), the requester's activity
 *          and unchanged sessions, and an identity outage each give their own code.
 * Boundary: test only; the binding and the record are built by hand, so every field can be tampered.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0509; STA-1724 (P-007, P-019, P-020, P-021).
 */
import {
  type Actor,
  ActorKind,
  IdentityResolver,
  Realm,
  type Email,
  type PublicId,
  type VerifiedPrincipal,
} from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";

import { ApprovalExecution } from "#contracts/enums/approval-execution.enum";
import { ApprovalStatus } from "#contracts/enums/approval-status.enum";
import type { ApprovalBinding } from "#contracts/types/approval-binding.type";
import type { ApprovalRecord } from "#contracts/types/approval-record.type";
import type { CallDescriptor } from "#contracts/types/call-descriptor.type";
import { fingerprintOf } from "#core/functions/fingerprint-of.function";
import { verifyApproval } from "#core/functions/verify-approval.function";
import { MemoryActorStatusCheckDriver } from "#testing/drivers/memory-actor-status-check.driver";

const NOW = new Date("2026-11-01T10:00:00.000Z");
const ID = "apr_01j9z3k4m5n6p7q8r9s0t1v2w3";
const KEY = "coupon.update@1";
const INPUT = { percent: 40 };

class Identity extends IdentityResolver {
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

const user = (id: `usr_${string}`, realm: Realm = Realm.Staff): Actor => ({
  kind: ActorKind.User,
  id,
  realm,
  scopeId: "ten_1",
});
const requester = user("usr_requester");
const vote = (id: `usr_${string}`, realm: Realm = Realm.Staff) => ({
  voter: user(id, realm),
  realm,
  at: new Date("2026-11-01T09:30:00.000Z"),
});

const call = {
  callId: "c1",
  type: class {},
  kind: "action",
  key: KEY,
  actor: requester,
  scopeId: "ten_1",
  area: "app",
} as unknown as CallDescriptor;

async function binding(overrides: Partial<ApprovalBinding> = {}): Promise<ApprovalBinding> {
  return {
    approvalId: ID,
    scopeId: "ten_1",
    requester,
    key: KEY,
    inputHash: await fingerprintOf(KEY, INPUT),
    requestedAt: new Date("2026-11-01T09:00:00.000Z"),
    expiresAt: new Date("2026-11-04T09:00:00.000Z"),
    approvals: 1,
    permission: "billing.coupon.approve",
    confirm: false,
    execute: ApprovalExecution.OnGrant,
    ...overrides,
  };
}

function record(overrides: Partial<ApprovalRecord> = {}): ApprovalRecord {
  return {
    approvalId: ID,
    status: ApprovalStatus.Executing,
    key: KEY,
    scopeId: "ten_1",
    requester,
    snapshot: INPUT,
    votes: [vote("usr_a")],
    execute: ApprovalExecution.OnGrant,
    grantedAt: new Date("2026-11-01T09:45:00.000Z"),
    executionKey: `approval:${ID}`,
    ...overrides,
  };
}

async function verify(
  parts: {
    binding?: Partial<ApprovalBinding> | null;
    record?: Partial<ApprovalRecord> | null;
    call?: Partial<CallDescriptor>;
    inputHash?: string;
    actors?: MemoryActorStatusCheckDriver;
    now?: Date;
  } = {},
): Promise<void> {
  await verifyApproval({
    call: { ...call, ...parts.call },
    inputHash: parts.inputHash ?? (await fingerprintOf(KEY, INPUT)),
    binding: parts.binding === null ? undefined : await binding(parts.binding),
    record: parts.record === null ? undefined : record(parts.record),
    executionKey: `approval:${ID}`,
    now: parts.now ?? NOW,
    identity: new Identity(),
    actors: parts.actors ?? new MemoryActorStatusCheckDriver(),
  });
}

describe(verifyApproval, () => {
  it("passes an executing request of enough distinct people", async () => {
    await expect(verify()).resolves.toBeUndefined();
  });

  it("passes a granted on_resubmit request", async () => {
    await expect(
      verify({
        binding: { execute: ApprovalExecution.OnResubmit },
        record: { status: ApprovalStatus.Granted, execute: ApprovalExecution.OnResubmit },
      }),
    ).resolves.toBeUndefined();
  });

  it("refuses approval_mismatch for each difference between the call and the binding", async () => {
    await expect(verify({ binding: null })).rejects.toMatchObject({ code: "approval_mismatch" });
    await expect(verify({ binding: { scopeId: "ten_2" } })).rejects.toMatchObject({
      code: "approval_mismatch",
    });
    await expect(
      verify({
        binding: { scope: { id: "scp_01j9z3k4m5n6p7q8r9s0t1v2w1", path: "platform.acme" } },
      }),
    ).rejects.toMatchObject({ code: "approval_mismatch" });
    await expect(verify({ binding: { requester: user("usr_other") } })).rejects.toMatchObject({
      code: "approval_mismatch",
    });
    await expect(
      verify({ binding: { requester: { ...requester, onBehalfOf: user("usr_x") } } }),
    ).rejects.toMatchObject({ code: "approval_mismatch" });
    await expect(verify({ binding: { key: "coupon.other@1" } })).rejects.toMatchObject({
      code: "approval_mismatch",
    });
    await expect(verify({ inputHash: "another" })).rejects.toMatchObject({
      code: "approval_mismatch",
    });
  });

  it("refuses approval_mismatch for each tampered store row", async () => {
    for (const tampered of [
      null,
      { approvalId: "apr_other" },
      { key: "coupon.other@1" },
      { scopeId: "ten_2" },
      { requester: user("usr_other") },
      { execute: ApprovalExecution.OnResubmit },
      { snapshot: { percent: 99 } },
      { snapshot: undefined },
    ] as const)
      await expect(
        verify({ record: tampered as Partial<ApprovalRecord> | null }),
      ).rejects.toMatchObject({
        code: "approval_mismatch",
      });
  });

  it("refuses by status: not granted, expired, consumed", async () => {
    for (const status of [ApprovalStatus.Rejected, ApprovalStatus.Withdrawn])
      await expect(verify({ record: { status } })).rejects.toMatchObject({
        code: "approval_not_granted",
      });
    await expect(verify({ record: { status: ApprovalStatus.Pending } })).rejects.toMatchObject({
      code: "approval_not_granted",
    });
    await expect(
      verify({
        record: { status: ApprovalStatus.Pending },
        now: new Date("2026-11-05T00:00:00.000Z"),
      }),
    ).rejects.toMatchObject({ code: "approval_expired" });
    await expect(verify({ record: { status: ApprovalStatus.Expired } })).rejects.toMatchObject({
      code: "approval_expired",
    });
    for (const status of [ApprovalStatus.Executed, ApprovalStatus.Failed, ApprovalStatus.Unknown])
      await expect(verify({ record: { status } })).rejects.toMatchObject({
        code: "approval_consumed",
      });
    await expect(verify({ record: { executionKey: "approval:other" } })).rejects.toMatchObject({
      code: "approval_consumed",
    });
    await expect(verify({ record: { status: ApprovalStatus.Granted } })).rejects.toMatchObject({
      code: "approval_consumed",
    });
  });

  it("refuses a granted request 24 hours after its grant, whatever its own window", async () => {
    await expect(verify({ now: new Date("2026-11-02T09:46:00.000Z") })).rejects.toMatchObject({
      code: "approval_expired",
    });
    await expect(verify({ record: { grantedAt: undefined } })).rejects.toMatchObject({
      code: "approval_expired",
    });
  });

  it("counts distinct people: too few, the same person twice, the requester's person, other realms", async () => {
    await expect(verify({ record: { votes: [] } })).rejects.toMatchObject({
      code: "approval_not_granted",
    });
    await expect(
      verify({ binding: { approvals: 2 }, record: { votes: [vote("usr_a"), vote("usr_a")] } }),
    ).rejects.toMatchObject({ code: "approval_not_granted" });
    await expect(
      verify({ binding: { approvals: 2 }, record: { votes: [vote("usr_a"), vote("usr_b")] } }),
    ).resolves.toBeUndefined();
    await expect(
      verify({ record: { votes: [vote("usr_a"), vote("usr_requester")] } }),
    ).rejects.toMatchObject({ code: "approval_mismatch" });
    await expect(
      verify({ record: { votes: [vote("usr_a", Realm.Customer)] } }),
    ).rejects.toMatchObject({ code: "approval_not_granted" });
    const agentVote = { ...vote("usr_a"), voter: { kind: ActorKind.Agent, id: "agt_1" } as Actor };
    await expect(verify({ record: { votes: [agentVote] } })).rejects.toMatchObject({
      code: "approval_not_granted",
    });
  });

  it("refuses an inactive requester, changed sessions, and an identity outage", async () => {
    const inactive = new MemoryActorStatusCheckDriver();
    inactive.deactivate("usr_requester");
    await expect(verify({ actors: inactive })).rejects.toMatchObject({ code: "forbidden" });
    const changed = new MemoryActorStatusCheckDriver();
    changed.markChanged("usr_requester", new Date("2026-11-01T09:30:00.000Z"));
    await expect(verify({ actors: changed })).rejects.toMatchObject({ code: "step_up_required" });
    const down = new MemoryActorStatusCheckDriver();
    down.setOutage(true);
    await expect(verify({ actors: down })).rejects.toMatchObject({
      code: "approval_identity_unavailable",
    });
  });
});
