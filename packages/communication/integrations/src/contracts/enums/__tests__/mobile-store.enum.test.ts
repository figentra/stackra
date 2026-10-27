/**
 * Stackra file contract:
 * Purpose: unit tests of `MobileStore`: the two stores of D14, in snake_case.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); app-shells D14; ADR 0231 (snake_case codes).
 */
import { Enum } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";

import { MobileStore } from "#contracts/enums/mobile-store.enum";

describe("MobileStore", () => {
  it("has the App Store and Google Play", () => {
    expect(Enum.values(MobileStore)).toEqual(["app_store", "google_play"]);
  });
});
