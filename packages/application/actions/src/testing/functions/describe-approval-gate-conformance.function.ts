/**
 * Stackra file contract:
 * Purpose: `describeApprovalGateConformance(name, make)`, the port conformance suite of `ApprovalGate`: it registers the
 *          tests every driver must pass: `park` then `find`, an unknown id, the FR-021 table (`granted → executing` by
 *          compare-and-set and its same-key retry, `executing → executed | failed` by compare-and-set, reject and
 *          withdraw only from `pending`), the snapshot deleted at a final state, and the pending cap.
 * Boundary: test support. The memory driver runs it here; the OS tasks-approvals driver runs it in its own repository.
 *           `make` returns the gate and the store-specific moves (`grant`, `reject`, `withdraw`) that the port does not
 *           carry, because a vote is the store's own action.
 * Runtime: node
 * Governing contract: ADR 0509 (the store's states, S3); ADR 0269 (tests import @stackra/testing); STA-1724 FR-021,
 *                     SC-002.
 */
import { ActorKind, mintPublicId, Realm } from "@stackra/contracts";
import type { Actor } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";

import { ApprovalExecution } from "#contracts/enums/approval-execution.enum";
import { ApprovalStatus } from "#contracts/enums/approval-status.enum";
import type { ApprovalDraft } from "#contracts/types/approval-draft.type";
import type { ApprovalGateHarness } from "#testing/types/approval-gate-harness.type";

const APPROVE = "billing.coupon.approve";

const REQUESTER: Actor = {
  kind: ActorKind.User,
  id: "usr_01j9z3k4m5n6p7q8r9s0t1v2w3",
  realm: Realm.Staff,
  scopeId: "tnt_01j9z3k4m5n6p7q8r9s0t1v2w3",
};

/** A pending draft of `key` for `requester`, with a fresh id and a snapshot. */
function draftOf(key = "billing.coupon.update@1", requester: Actor = REQUESTER): ApprovalDraft {
  return {
    approvalId: mintPublicId("apr"),
    key,
    scopeId: "tnt_01j9z3k4m5n6p7q8r9s0t1v2w3",
    requester,
    snapshot: { percent: 40 },
    requirement: { approvals: 1, permission: APPROVE, expiresAfter: "72h" },
    expiresAt: new Date(Date.now() + 72 * 3_600_000),
    execute: ApprovalExecution.OnGrant,
  };
}

/**
 * Registers the `ApprovalGate` conformance tests under `describe(name)`.
 *
 * @example
 * describeApprovalGateConformance("MemoryApprovalGateDriver", () => harnessOver(new MemoryApprovalGateDriver(...)));
 */
export function describeApprovalGateConformance(
  name: string,
  make: () => ApprovalGateHarness | Promise<ApprovalGateHarness>,
): void {
  describe(`ApprovalGate conformance: ${name}`, () => {
    it("parks a request that find reads back pending, with its snapshot and no votes", async () => {
      const { gate } = await make();
      const draft = draftOf();
      await gate.park(draft);
      const record = await gate.find(draft.approvalId);
      expect(record).toMatchObject({
        approvalId: draft.approvalId,
        status: ApprovalStatus.Pending,
        key: draft.key,
        scopeId: draft.scopeId,
        snapshot: { percent: 40 },
        votes: [],
        execute: ApprovalExecution.OnGrant,
      });
      expect(record?.requester.id).toBe(REQUESTER.id);
    });

    it("finds nothing for an unknown id and moves nothing", async () => {
      const { gate } = await make();
      await expect(gate.find("apr_unknown")).resolves.toBeUndefined();
      await expect(gate.begin("apr_unknown", "approval:apr_unknown")).resolves.toBe(false);
      await expect(gate.settle("apr_unknown", { status: "executed" })).resolves.toBe(false);
    });

    it("moves granted to executing by compare-and-set, and answers its own key again", async () => {
      const { gate, grant } = await make();
      const draft = draftOf();
      await gate.park(draft);
      await expect(gate.begin(draft.approvalId, "approval:a")).resolves.toBe(false);
      await grant(draft.approvalId);
      expect((await gate.find(draft.approvalId))?.status).toBe(ApprovalStatus.Granted);
      await expect(gate.begin(draft.approvalId, "approval:a")).resolves.toBe(true);
      const running = await gate.find(draft.approvalId);
      expect(running).toMatchObject({
        status: ApprovalStatus.Executing,
        executionKey: "approval:a",
      });
      await expect(gate.begin(draft.approvalId, "approval:a")).resolves.toBe(true);
      await expect(gate.begin(draft.approvalId, "approval:other")).resolves.toBe(false);
    });

    it("settles only from executing, once, and deletes the snapshot at the final state", async () => {
      const { gate, grant } = await make();
      const draft = draftOf();
      await gate.park(draft);
      await expect(gate.settle(draft.approvalId, { status: "executed" })).resolves.toBe(false);
      await grant(draft.approvalId);
      await expect(gate.settle(draft.approvalId, { status: "executed" })).resolves.toBe(false);
      await gate.begin(draft.approvalId, "approval:a");
      await expect(gate.settle(draft.approvalId, { status: "executed" })).resolves.toBe(true);
      await expect(
        gate.settle(draft.approvalId, { status: "failed", code: "forbidden" }),
      ).resolves.toBe(false);
      const done = await gate.find(draft.approvalId);
      expect(done?.status).toBe(ApprovalStatus.Executed);
      expect(done?.snapshot).toBeUndefined();
    });

    it("records the refusal code of a failed execution", async () => {
      const { gate, grant } = await make();
      const draft = draftOf();
      await gate.park(draft);
      await grant(draft.approvalId);
      await gate.begin(draft.approvalId, "approval:a");
      await expect(
        gate.settle(draft.approvalId, { status: "failed", code: "forbidden" }),
      ).resolves.toBe(true);
      expect(await gate.find(draft.approvalId)).toMatchObject({
        status: ApprovalStatus.Failed,
        failureCode: "forbidden",
      });
    });

    it("settles a stuck execution unknown, once, and deletes the snapshot", async () => {
      const { gate, grant } = await make();
      const draft = draftOf();
      await gate.park(draft);
      await grant(draft.approvalId);
      await gate.begin(draft.approvalId, "approval:a");
      await expect(gate.settle(draft.approvalId, { status: "unknown" })).resolves.toBe(true);
      await expect(gate.settle(draft.approvalId, { status: "executed" })).resolves.toBe(false);
      const done = await gate.find(draft.approvalId);
      expect(done?.status).toBe(ApprovalStatus.Unknown);
      expect(done?.snapshot).toBeUndefined();
    });

    it("rejects and withdraws only a pending request, which then never begins", async () => {
      const { gate, reject, withdraw, grant } = await make();
      const rejected = draftOf();
      const withdrawn = draftOf();
      const granted = draftOf();
      await gate.park(rejected);
      await gate.park(withdrawn);
      await gate.park(granted);
      await reject(rejected.approvalId);
      await withdraw(withdrawn.approvalId);
      await grant(granted.approvalId);
      expect(await gate.find(rejected.approvalId)).toMatchObject({
        status: ApprovalStatus.Rejected,
      });
      expect((await gate.find(rejected.approvalId))?.snapshot).toBeUndefined();
      expect(await gate.find(withdrawn.approvalId)).toMatchObject({
        status: ApprovalStatus.Withdrawn,
      });
      await expect(reject(rejected.approvalId)).rejects.toThrow();
      await expect(withdraw(withdrawn.approvalId)).rejects.toThrow();
      await expect(reject(granted.approvalId)).rejects.toThrow();
      await expect(withdraw(granted.approvalId)).rejects.toThrow();
      await expect(gate.begin(rejected.approvalId, "approval:a")).resolves.toBe(false);
      await expect(gate.begin(withdrawn.approvalId, "approval:a")).resolves.toBe(false);
    });

    it("refuses a park beyond the cap of pending requests per requester and action", async () => {
      const { gate, cap } = await make();
      for (let index = 0; index < cap; index += 1) await gate.park(draftOf());
      await expect(gate.park(draftOf())).rejects.toMatchObject({ code: "approval_pending_limit" });
      // another action and another requester have their own cap
      await expect(gate.park(draftOf("billing.coupon.create@1"))).resolves.toBeUndefined();
      await expect(
        gate.park(draftOf(undefined, { ...REQUESTER, id: "usr_01j9z3k4m5n6p7q8r9s0t1v2w9" })),
      ).resolves.toBeUndefined();
    });
  });
}
