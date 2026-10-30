/**
 * Stackra file contract:
 * Purpose: unit tests of `mobileIdsOf`: ids derive from the product and app keys, drop a repeated app key, keep `-` on
 *          iOS and turn it into `_` on Android, and a set id is answered unchanged.
 * Boundary: test only; pure.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0439 (decision 6); ADR 0482 (decision 2).
 */
import { describe, expect, it } from "@stackra/testing";

import { mobileIdsOf } from "#core/functions/mobile-ids-of.function";

describe("mobileIdsOf", () => {
  // @covers sta-1623:FR-002
  it("derives com.figentra.<product>.<app>", () => {
    expect(mobileIdsOf("commerce", "staff")).toEqual({
      bundleId: "com.figentra.commerce.staff",
      packageName: "com.figentra.commerce.staff",
    });
  });

  // @covers sta-1623:FR-002
  it("drops an app key that repeats the product and swaps - for _ on Android", () => {
    expect(mobileIdsOf("my-shop", "my-shop")).toEqual({
      bundleId: "com.figentra.my-shop",
      packageName: "com.figentra.my_shop",
    });
  });

  // @covers sta-1623:FR-002
  it("keeps the ids the identity sets", () => {
    expect(
      mobileIdsOf("academorix", "academorix", {
        ios: { bundleId: "app.academorix.mobile" },
        android: { package: "app.academorix.mobile" },
      }),
    ).toEqual({ bundleId: "app.academorix.mobile", packageName: "app.academorix.mobile" });
  });
});
