/**
 * Stackra file contract:
 * Purpose: the consumer contract of the `.` entry: the settings group and its section, the contrast refusal and the
 *          three contrast functions are its values, and nothing else.
 * Boundary: test only; imports the stand-in barrel through its `#core` alias.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0294 (decision 15).
 */
import { describe, expect, it } from "@stackra/testing";

import * as branding from "#core/index";

/** The `.` entry. */
describe("@stackra/branding", () => {
  /** Exactly these values. */
  it("exports exactly its values", () => {
    expect(Object.keys(branding).sort()).toEqual([
      "BrandColorContrastError",
      "BrandDisplayName",
      "BrandingSettings",
      "brandColorRefusals",
      "onColor",
    ]);
  });
});
