/**
 * Stackra file contract:
 * Purpose: `describeApprovalBindingStoreConformance(name, make)`, the port conformance suite of `ApprovalBindingStore`:
 *          insert then find returns every field, an unknown id finds nothing, a second insert of an id rejects (the row
 *          is never replaced), and the prune deletes only bindings that expired before the cutoff.
 * Boundary: test support. The memory driver runs it here; `@stackra/tenancy`'s Postgres driver runs it against a real
 *           database in its integration tests.
 * Runtime: node
 * Governing contract: ADR 0509 (the binding is insert-only, N7); ADR 0269; STA-1724 FR-007.
 */
import { ActorKind, AssuranceLevel, mintPublicId, Realm } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";

import { ApprovalExecution } from "#contracts/enums/approval-execution.enum";
import type { ApprovalBindingStore } from "#contracts/ports/approval-binding-store.port";
import type { ApprovalBinding } from "#contracts/types/approval-binding.type";

const APPROVE = "billing.coupon.approve";

/** A binding with a fresh id that expires at `expiresAt`. */
function bindingOf(expiresAt: Date): ApprovalBinding {
  return {
    approvalId: mintPublicId("apr"),
    scopeId: "tnt_01j9z3k4m5n6p7q8r9s0t1v2w3",
    requester: {
      kind: ActorKind.Agent,
      id: "agt_01j9z3k4m5n6p7q8r9s0t1v2w5",
      scopeId: "tnt_01j9z3k4m5n6p7q8r9s0t1v2w3",
      onBehalfOf: {
        kind: ActorKind.User,
        id: "usr_01j9z3k4m5n6p7q8r9s0t1v2w3",
        realm: Realm.Staff,
        scopeId: "tnt_01j9z3k4m5n6p7q8r9s0t1v2w3",
      },
    },
    key: "billing.coupon.update@1",
    inputHash: "9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08",
    assurance: {
      amr: ["pwd", "otp"],
      authTime: new Date("2026-11-01T08:00:00.000Z"),
      level: AssuranceLevel.Aal2,
    },
    requestedAt: new Date("2026-11-01T09:00:00.000Z"),
    expiresAt,
    approvals: 2,
    permission: APPROVE,
    approverLevel: AssuranceLevel.Aal2,
    confirm: false,
    execute: ApprovalExecution.OnGrant,
  };
}

/**
 * Registers the `ApprovalBindingStore` conformance tests under `describe(name)`.
 *
 * @example
 * describeApprovalBindingStoreConformance("MemoryApprovalBindingStoreDriver", () => new MemoryApprovalBindingStoreDriver());
 */
export function describeApprovalBindingStoreConformance(
  name: string,
  make: () => ApprovalBindingStore | Promise<ApprovalBindingStore>,
): void {
  describe(`ApprovalBindingStore conformance: ${name}`, () => {
    it("returns every field of an inserted binding, chain and assurance included", async () => {
      const store = await make();
      const binding = bindingOf(new Date("2026-11-04T09:00:00.000Z"));
      await store.insert(binding);
      expect(await store.find(binding.approvalId)).toEqual(binding);
    });

    it("finds nothing for an unknown id", async () => {
      const store = await make();
      await expect(store.find("apr_unknown")).resolves.toBeUndefined();
    });

    it("never replaces a binding: a second insert of the id rejects and the first stays", async () => {
      const store = await make();
      const binding = bindingOf(new Date("2026-11-04T09:00:00.000Z"));
      await store.insert(binding);
      await expect(store.insert({ ...binding, inputHash: "tampered" })).rejects.toThrow();
      expect((await store.find(binding.approvalId))?.inputHash).toBe(binding.inputHash);
    });

    it("prunes only the bindings that expired before the cutoff", async () => {
      const store = await make();
      const old = bindingOf(new Date("2026-01-01T00:00:00.000Z"));
      const fresh = bindingOf(new Date("2026-12-01T00:00:00.000Z"));
      await store.insert(old);
      await store.insert(fresh);
      await expect(
        store.prune(new Date("2026-06-01T00:00:00.000Z")),
      ).resolves.toBeGreaterThanOrEqual(1);
      await expect(store.find(old.approvalId)).resolves.toBeUndefined();
      await expect(store.find(fresh.approvalId)).resolves.toEqual(fresh);
    });
  });
}
