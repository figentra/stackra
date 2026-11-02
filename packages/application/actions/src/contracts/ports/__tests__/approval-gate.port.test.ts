/**
 * Stackra file contract:
 * Purpose: unit tests of the `ApprovalGate` port: a port a driver extends with `decide`, `park`, `find`, `begin` and
 *          `settle`; a stand-in driver shows each method's contract.
 * Boundary: test only; a stand-in driver.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0509 (the port split).
 */
import { Driver } from "@stackra/container";
import { Port } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";

import { ApprovalGate } from "#contracts/ports/approval-gate.port";
import type { ApprovalDraft } from "#contracts/types/approval-draft.type";
import type { ApprovalOutcome } from "#contracts/types/approval-outcome.type";
import type { ApprovalRecord } from "#contracts/types/approval-record.type";
import type { ApprovalRequirement } from "#contracts/types/approval-requirement.type";
import type { CallDescriptor } from "#contracts/types/call-descriptor.type";

class OneApproval extends Driver(ApprovalGate) {
  readonly parked: ApprovalDraft[] = [];

  async decide(
    _call: CallDescriptor,
    _input: unknown,
    declared: ApprovalRequirement | undefined,
  ): Promise<ApprovalRequirement | undefined> {
    return declared === undefined ? { approvals: 1, expiresAfter: "72h" } : undefined;
  }

  async park(draft: ApprovalDraft): Promise<void> {
    this.parked.push(draft);
  }

  async find(approvalId: string): Promise<ApprovalRecord | undefined> {
    return this.parked.some((draft) => draft.approvalId === approvalId)
      ? ({ approvalId } as ApprovalRecord)
      : undefined;
  }

  async begin(_approvalId: string, _executionKey: string): Promise<boolean> {
    return true;
  }

  async settle(_approvalId: string, _outcome: ApprovalOutcome): Promise<boolean> {
    return true;
  }
}

describe("ApprovalGate", () => {
  it("is a port with decide, park, find, begin and settle", async () => {
    const gate = new OneApproval();
    expect(gate).toBeInstanceOf(ApprovalGate);
    expect(gate).toBeInstanceOf(Port);
    const call = {} as CallDescriptor;
    await expect(gate.decide(call, {}, undefined)).resolves.toEqual({
      approvals: 1,
      expiresAfter: "72h",
    });
    await expect(
      gate.decide(call, {}, { approvals: 2, expiresAfter: "72h" }),
    ).resolves.toBeUndefined();
    // reason: a draft reduced to its id, the only field this fake reads
    await gate.park({ approvalId: "apr_1" } as unknown as ApprovalDraft);
    await expect(gate.find("apr_1")).resolves.toMatchObject({ approvalId: "apr_1" });
    await expect(gate.find("apr_2")).resolves.toBeUndefined();
    await expect(gate.begin("apr_1", "approval:apr_1")).resolves.toBe(true);
    await expect(gate.settle("apr_1", { status: "executed" })).resolves.toBe(true);
  });
});
