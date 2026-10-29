/**
 * Stackra file contract:
 * Purpose: proves `withNativeCustomerDisplay` returns the app config unchanged.
 * Boundary: test only; the config is a plain object, no Expo CLI runs.
 * Runtime: node (vitest)
 * Governing contract: ADR 0478 (decision 2); ADR 0022 (test placement).
 */
import { describe, expect, it } from "@stackra/testing";

import { withNativeCustomerDisplay } from "../with-native-customer-display.function";

describe("withNativeCustomerDisplay", () => {
  it("returns the app config unchanged", () => {
    const config = { name: "Till", slug: "till" };
    expect(withNativeCustomerDisplay(config)).toBe(config);
  });
});
