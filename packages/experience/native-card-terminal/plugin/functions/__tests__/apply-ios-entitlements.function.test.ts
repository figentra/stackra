/**
 * Stackra file contract:
 * Purpose: proves `applyIosEntitlements` adds the Tap to Pay entitlement only when the app turns Tap to Pay on.
 * Boundary: test only; no Expo.
 * Runtime: node (vitest)
 * Governing contract: ADR 0479 (decision 6); ADR 0022 (test placement).
 */
import { describe, expect, it } from "@stackra/testing";

import { applyIosEntitlements } from "#plugin/functions/apply-ios-entitlements.function";

const OWN = { "aps-environment": "production" };

describe("applyIosEntitlements", () => {
  it("leaves the entitlements alone while Tap to Pay is off", () => {
    expect(applyIosEntitlements(OWN, {})).toEqual(OWN);
    expect(applyIosEntitlements(OWN, { isTapToPayEnabled: false })).toEqual(OWN);
  });

  it("adds the proximity reader entitlement when Tap to Pay is on", () => {
    expect(applyIosEntitlements(OWN, { isTapToPayEnabled: true })).toEqual({
      ...OWN,
      "com.apple.developer.proximity-reader.payment.acceptance": true,
    });
  });
});
