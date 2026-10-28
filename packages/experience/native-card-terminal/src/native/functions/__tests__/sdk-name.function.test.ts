/**
 * Stackra file contract:
 * Purpose: proves `sdkName` reads the iOS case names and the Android enum names alike, as Stripe's API spells them.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0479 (decision 1); ADR 0022 (test placement).
 */
import { describe, expect, it } from "@stackra/testing";

import { sdkName } from "#native/functions/sdk-name.function";

describe("sdkName", () => {
  it("snake-cases both platforms' names and keeps Stripe's own", () => {
    expect(sdkName("requiresCapture")).toBe("requires_capture");
    expect(sdkName("REQUIRES_CAPTURE")).toBe("requires_capture");
    expect(sdkName("requires_capture")).toBe("requires_capture");
    expect(sdkName("stripeM2")).toBe("stripe_m2");
    expect(sdkName("TAP_TO_PAY_DEVICE")).toBe("tap_to_pay_device");
    expect(sdkName("Tap To Pay")).toBe("tap_to_pay");
  });
});
