/**
 * Stackra file contract:
 * Purpose: unit tests of `OnboardingInput`: exactly its snake_case codes, in order.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0231.
 */
import { Enum } from "@stackra/contracts";
import { describe, expect, it } from "@stackra/testing";

import { OnboardingInput } from "#contracts/enums/onboarding-input.enum";

describe("OnboardingInput", () => {
  it("has exactly its codes", () => {
    expect(Enum.values(OnboardingInput)).toEqual([
      "otp",
      "csr",
      "client_id",
      "client_secret",
      "preshared_key",
      "device_serial",
      "device_os_version",
    ]);
  });
});
