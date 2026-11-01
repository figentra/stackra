/**
 * Stackra file contract:
 * Purpose: unit and type tests of `ApprovalCondition`: the bare kind is registered as `approval_condition`, a subclass
 *          declares the settings keys it reads in a static `reads` (none by default), gets its limited reader through
 *          its constructor and answers `needed`, and `needed` must be implemented.
 * Boundary: test only; the condition is billing's coupon threshold.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0509; STA-1724 FR-002.
 */
import { kindOf } from "@stackra/container";
import { describe, expect, it } from "@stackra/testing";

import { ApprovalCondition } from "#core/bases/approval-condition.base";
import { limitedSettingsReader } from "#core/functions/limited-settings-reader.function";
import type { ActionContext } from "#core/types/action-context.type";
import type { ApprovalSettingsReader } from "#core/types/approval-settings-reader.type";

class CouponAboveThresholdCondition extends ApprovalCondition {
  static override readonly reads = ["billing.coupon.maxPercent"] as const;

  private readonly settings: ApprovalSettingsReader;

  constructor(settings: ApprovalSettingsReader) {
    super();
    this.settings = settings;
  }

  async needed(input: { readonly percent: number }, _ctx: ActionContext): Promise<boolean> {
    return input.percent > Number(await this.settings.get("billing.coupon.maxPercent"));
  }
}

class EveryCallCondition extends ApprovalCondition {
  async needed(): Promise<boolean> {
    return true;
  }
}

describe("ApprovalCondition", () => {
  it("is the approval_condition kind", () => {
    expect(kindOf(ApprovalCondition)).toEqual({ kind: "approval_condition", options: {} });
  });

  it("reads no key unless it lists it", () => {
    expect(EveryCallCondition.reads).toEqual([]);
    expect(CouponAboveThresholdCondition.reads).toEqual(["billing.coupon.maxPercent"]);
  });

  it("compares the input with a threshold read through its limited reader", async () => {
    const settings = limitedSettingsReader(CouponAboveThresholdCondition.reads, async () => 20);
    const condition = new CouponAboveThresholdCondition(settings);
    const ctx = {} as ActionContext;
    await expect(condition.needed({ percent: 40 }, ctx)).resolves.toBe(true);
    await expect(condition.needed({ percent: 5 }, ctx)).resolves.toBe(false);
  });
});
