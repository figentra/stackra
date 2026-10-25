/**
 * Stackra file contract:
 * Purpose: unit tests of `PEPPOL_OPTIONS`: a complete pack section passes and a section missing a field or holding a
 *          misfit
 *          fails.
 * Boundary: test only; the option values are samples, never a market's real values (ADR 0363 decision 9).
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0364 (decision 2).
 */
import { describe, expect, it } from "@stackra/testing";

import { PEPPOL_OPTIONS } from "#core/constants/peppol-options.constant";

const SAMPLE = {
  accessPointUrl: "https://ap.test/send",
  customizationId: "urn:sample:customization",
  profileId: "urn:sample:profile",
  timeZone: "UTC",
};

describe("PEPPOL_OPTIONS", () => {
  it("accepts a complete pack section", () => {
    expect(PEPPOL_OPTIONS.safeParse(SAMPLE).success).toBe(true);
  });

  it("refuses a section without `customizationId`", () => {
    const { customizationId: _left, ...rest } = SAMPLE;
    expect(PEPPOL_OPTIONS.safeParse(rest).success).toBe(false);
  });
});
