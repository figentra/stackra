/**
 * Stackra file contract:
 * Purpose: unit tests of `MemoryApprovalBindingStoreDriver`: it is an `ApprovalBindingStore`, passes the port
 *          conformance suite, and keeps frozen copies so a caller cannot edit a stored binding.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0509 (N7); STA-1724 (P-019).
 */
import { describe, expect, it } from "@stackra/testing";

import { ApprovalBindingStore } from "#contracts/ports/approval-binding-store.port";
import { MemoryApprovalBindingStoreDriver } from "#testing/drivers/memory-approval-binding-store.driver";
import { describeApprovalBindingStoreConformance } from "#testing/functions/describe-approval-binding-store-conformance.function";

describeApprovalBindingStoreConformance(
  "MemoryApprovalBindingStoreDriver",
  () => new MemoryApprovalBindingStoreDriver(),
);

describe(MemoryApprovalBindingStoreDriver, () => {
  it("is an ApprovalBindingStore", () => {
    expect(new MemoryApprovalBindingStoreDriver()).toBeInstanceOf(ApprovalBindingStore);
  });

  it("stores a frozen copy", async () => {
    const store = new MemoryApprovalBindingStoreDriver();
    const binding = {
      approvalId: "apr_1",
      scopeId: "tnt_1",
      requester: { kind: "system", id: "sys_1" },
      key: "k@1",
      inputHash: "h",
      requestedAt: new Date(0),
      expiresAt: new Date(1),
      approvals: 1,
      confirm: false,
      execute: "on_grant",
    } as const;
    await store.insert(binding as never);
    const stored = await store.find("apr_1");
    expect(Object.isFrozen(stored)).toBe(true);
    expect(stored).not.toBe(binding);
  });
});
