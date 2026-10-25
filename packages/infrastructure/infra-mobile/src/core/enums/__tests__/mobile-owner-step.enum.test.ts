/**
 * Stackra file contract:
 * Purpose: unit tests of `MobileOwnerStep`: the nine manual steps in the order a new app takes them, as snake_case
 *          codes.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0344 (decision 11); ADR 0231 (snake_case codes).
 */
import { Enum } from "@stackra/contracts";
import { describe, expect, expectTypeOf, it } from "@stackra/testing";

import { MobileOwnerStep } from "#core/enums/mobile-owner-step.enum";

describe("MobileOwnerStep", () => {
  it("lists the steps in order", () => {
    expect(Enum.values(MobileOwnerStep)).toEqual([
      "eas_project",
      "apple_team",
      "app_store_record",
      "ios_signing",
      "apns_key",
      "play_app",
      "play_app_signing",
      "android_signing",
      "fcm_key",
    ]);
    expectTypeOf<MobileOwnerStep>().toEqualTypeOf<
      | "eas_project"
      | "apple_team"
      | "app_store_record"
      | "ios_signing"
      | "apns_key"
      | "play_app"
      | "play_app_signing"
      | "android_signing"
      | "fcm_key"
    >();
  });

  it("uses snake_case codes", () => {
    for (const code of Enum.values(MobileOwnerStep)) expect(code).toMatch(/^[a-z]+(?:_[a-z]+)*$/);
  });
});
