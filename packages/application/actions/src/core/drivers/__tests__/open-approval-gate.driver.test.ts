/**
 * Stackra file contract:
 * Purpose: unit tests of `OpenApprovalGateDriver`: it is an `ApprovalGate` whose rules add nothing, and it cannot park,
 *          find, begin or settle a request.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0098 (decision 3); ADR 0509 (a declared stage fails closed).
 */
import { describe, expect, it } from "@stackra/testing";

import { ApprovalGate } from "#contracts/index";
import type { ApprovalDraft, CallDescriptor } from "#contracts/index";
import { OpenApprovalGateDriver } from "#core/drivers/open-approval-gate.driver";

describe(OpenApprovalGateDriver, () => {
  it("is an ApprovalGate that adds no requirement", async () => {
    const gate: ApprovalGate = new OpenApprovalGateDriver();
    expect(gate).toBeInstanceOf(ApprovalGate);
    const call = {} as CallDescriptor;
    await expect(gate.decide(call, { amount: 1 }, undefined)).resolves.toBeUndefined();
    await expect(
      gate.decide(call, {}, { approvals: 2, expiresAfter: "72h" }),
    ).resolves.toBeUndefined();
  });

  it("cannot park, so a declared stage fails closed with it bound", async () => {
    const gate: ApprovalGate = new OpenApprovalGateDriver();
    await expect(gate.park({} as ApprovalDraft)).rejects.toThrow(/cannot park/);
    await expect(gate.find("apr_1")).resolves.toBeUndefined();
    await expect(gate.begin("apr_1", "approval:apr_1")).resolves.toBe(false);
    await expect(gate.settle("apr_1", { status: "executed" })).resolves.toBe(false);
  });
});
