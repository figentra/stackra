/**
 * Stackra file contract:
 * Purpose: unit tests of `OpenApprovalGateDriver`: it is an `ApprovalGate` and lets every call through, with or
 *          without an approval id.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0098 (decision 3).
 */
import { describe, expect, it } from "@stackra/testing";

import { ApprovalGate } from "#contracts/index";
import type { CallDescriptor } from "#contracts/index";
import { OpenApprovalGateDriver } from "#core/drivers/open-approval-gate.driver";

describe(OpenApprovalGateDriver, () => {
  it("is an ApprovalGate that needs no approval", async () => {
    const gate: ApprovalGate = new OpenApprovalGateDriver();
    expect(gate).toBeInstanceOf(ApprovalGate);
    const call = {} as CallDescriptor;
    await expect(gate.check(call, { amount: 1 }, undefined)).resolves.toBeUndefined();
    await expect(gate.check(call, {}, "apr_1")).resolves.toBeUndefined();
  });
});
