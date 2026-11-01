/**
 * Stackra file contract:
 * Purpose: unit tests of `PruneApprovalBindingsAction`: it is a system-only daily job, and it prunes with the cutoff of
 *          now minus the 24-hour execution tail minus the 397-day retention window, resolving to the deleted count.
 * Boundary: test only; the binding store is a recording stand-in.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0509 (N7); STA-1724.
 */
import type { ActionContext } from "@stackra/actions";
import { ApprovalBindingStore } from "@stackra/actions/contracts";
import type { ApprovalBinding } from "@stackra/actions/contracts";
import { Driver, kindOf } from "@stackra/container";
import { AUDIT_HOT_RETENTION, Duration } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";

import { PruneApprovalBindingsAction } from "#node/actions/prune-approval-bindings.action";

class RecordingBindings extends Driver(ApprovalBindingStore) {
  cutoff: Date | undefined;

  async insert(_binding: ApprovalBinding): Promise<void> {}

  async find(_approvalId: string): Promise<ApprovalBinding | undefined> {
    return undefined;
  }

  async prune(cutoff: Date): Promise<number> {
    this.cutoff = cutoff;
    return 3;
  }
}

describe(PruneApprovalBindingsAction, () => {
  it("is a system-only daily job per tenant", () => {
    expect(kindOf(PruneApprovalBindingsAction)?.options).toMatchObject({
      key: "approval_binding.prune",
      actors: ["system"],
      job: { unique: true, cron: { schedule: "15 4 * * *", perScope: true } },
    });
  });

  it("keeps a binding for its window, the 24-hour tail and 397 days, then prunes", async () => {
    const bindings = new RecordingBindings();
    const now = new Date("2027-12-01T04:15:00.000Z");
    const output = await new PruneApprovalBindingsAction(bindings).handle({}, {
      now: () => now,
    } as unknown as ActionContext);
    expect(output).toEqual({ deleted: 3 });
    const kept = 24 * 3_600_000 + 397 * 86_400_000;
    expect(bindings.cutoff?.getTime()).toBe(now.getTime() - kept);
    expect(Duration.toMilliseconds(AUDIT_HOT_RETENTION)).toBe(397 * 86_400_000);
  });
});
