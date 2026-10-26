/**
 * Stackra file contract:
 * Purpose: unit tests of `ETA_ONBOARDING_OPTIONS`: a token URL passes beside other mandate options; none is refused.
 * Boundary: test only; the values are samples.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0364.
 */
import { describe, expect, it } from "@stackra/testing";

import { ETA_ONBOARDING_OPTIONS } from "#core/constants/eta-onboarding-options.constant";

describe("ETA_ONBOARDING_OPTIONS", () => {
  it("takes a token URL and ignores the mandate's other options", () => {
    expect(
      ETA_ONBOARDING_OPTIONS.parse({ tokenUrl: "https://id.authority.test/connect/token", x: 1 }),
    ).toEqual({ tokenUrl: "https://id.authority.test/connect/token" });
  });

  it("refuses options without a token URL", () => {
    expect(ETA_ONBOARDING_OPTIONS.safeParse({}).success).toBe(false);
  });
});
