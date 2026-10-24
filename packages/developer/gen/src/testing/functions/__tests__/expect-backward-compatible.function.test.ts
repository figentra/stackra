/**
 * Stackra file contract:
 * Purpose: unit tests of `expectBackwardCompatible`: an additive manifest passes, a breaking one fails with every break
 *          on its own line and the fix, and `today` reaches the sunset rule.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0294 (decision 22); ADR 0131.
 */
import type { StackraManifest } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";

import { expectBackwardCompatible } from "#testing/functions/expect-backward-compatible.function";

const PREVIOUS: StackraManifest = {
  member: "loyalty_kit",
  package: "@acme/loyalty-kit",
  version: "0.4.0",
  permissions: [{ key: "loyalty_kit.loyalty_account.redeem", risk: "L1" }],
  errors: [{ code: "insufficient_points", kind: "failed_precondition" }],
  events: [
    {
      name: "loyalty_kit.points.earned.v2",
      module: "loyalty_kit",
      class: "PointsEarned",
      kind: "integration",
      changes: [{ from: 1, sunset: "2027-01-01" }],
    },
  ],
};

describe("expectBackwardCompatible", () => {
  it("passes an additive manifest", () => {
    expect(() =>
      expectBackwardCompatible(PREVIOUS, {
        ...PREVIOUS,
        permissions: [...(PREVIOUS.permissions ?? []), { key: "loyalty_kit.x.y", risk: "L0" }],
      }),
    ).not.toThrow();
  });

  it("fails listing every break", () => {
    const next: StackraManifest = { ...PREVIOUS, permissions: [], errors: [] };
    expect(() => expectBackwardCompatible(PREVIOUS, next)).toThrow(
      /2 breaks\):\n {2}permissions loyalty_kit\.loyalty_account\.redeem: removed\n {2}errors insufficient_points: removed\n/,
    );
  });

  it("applies the sunset date", () => {
    const next: StackraManifest = {
      ...PREVIOUS,
      events: [
        {
          ...(PREVIOUS.events?.[0] as NonNullable<StackraManifest["events"]>[number]),
          changes: [],
        },
      ],
    };
    expect(() => expectBackwardCompatible(PREVIOUS, next, { today: "2026-10-24" })).toThrow(
      /dropped before its sunset/,
    );
    expect(() => expectBackwardCompatible(PREVIOUS, next, { today: "2027-06-01" })).not.toThrow();
  });
});
