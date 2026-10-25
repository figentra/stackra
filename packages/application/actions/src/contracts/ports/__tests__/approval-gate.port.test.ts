/**
 * Stackra file contract:
 * Purpose: unit tests of the `ApprovalGate` port: a port a driver extends, which lets a call through, or refuses it
 *          with `approval_required` and the parked request's id.
 * Boundary: test only; a stand-in driver.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0098 (decision 3).
 */
import { Driver } from "@stackra/container";
import { Port } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";

import { ApprovalGate } from "#contracts/ports/approval-gate.port";
import type { CallDescriptor } from "#contracts/types/call-descriptor.type";
import { ApprovalRequiredError } from "#core/errors/approval-required.error";

class OneApproval extends Driver(ApprovalGate) {
  async check(
    _call: CallDescriptor,
    _input: unknown,
    approvalId: string | undefined,
  ): Promise<void> {
    if (approvalId !== "apr_1") throw ApprovalRequiredError.create({ approvalId: "apr_1" });
  }
}

describe("ApprovalGate", () => {
  it("is a port that parks or lets a call through", async () => {
    const gate = new OneApproval();
    expect(gate).toBeInstanceOf(ApprovalGate);
    expect(gate).toBeInstanceOf(Port);
    const call = {} as CallDescriptor;
    await expect(gate.check(call, {}, undefined)).rejects.toMatchObject({ approvalId: "apr_1" });
    await expect(gate.check(call, {}, "apr_1")).resolves.toBeUndefined();
  });
});
