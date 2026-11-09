/**
 * Stackra file contract:
 * Purpose: unit tests of `brandColorRefusals`: readable colours and unset colours pass, black on white measures 21:1
 *          and #767676 (4.54:1) is the lightest grey a primary may be; a mid-grey primary (4.47:1 at
 *          best) and a light-grey accent (2.32:1 on white) are each refused with the floored ratio, the minimum and
 *          the setting's path; a malformed value is left to the format rule.
 * Boundary: test only; pure.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; WCAG 2.2 (1.4.3, 1.4.11); STA-2644.
 */
import { describe, expect, it } from "@stackra/testing";
import { contrastRatio } from "@stackra/tokens";

import { BrandColorContrastError } from "#core/errors/brand-color-contrast.error";
import { brandColorRefusals } from "#core/functions/brand-color-refusals.function";

/** The contrast rules of the brand colours. */
describe("brandColorRefusals", () => {
  /** Nothing to refuse. */
  it("passes readable and unset colours", () => {
    expect(brandColorRefusals({ primaryColor: "#1D4ED8", accentColor: "#B45309" })).toEqual([]);
    expect(brandColorRefusals({ primaryColor: "#FACC15", accentColor: null })).toEqual([]);
    expect(brandColorRefusals({ primaryColor: null, accentColor: null })).toEqual([]);
  });

  /** Known pairs from @stackra/tokens' ratio: black on white is 21:1; #767676 is the lightest grey at 4.5:1. */
  it("measures known pairs and draws the line at the minimum", () => {
    expect(contrastRatio("#000000", "#FFFFFF")).toBeCloseTo(21, 10);
    expect(brandColorRefusals({ primaryColor: "#000000", accentColor: "#000000" })).toEqual([]);
    expect(brandColorRefusals({ primaryColor: "#767676", accentColor: null })).toEqual([]);
  });

  /** The primary needs 4.5:1 with its better on-colour. */
  it("refuses a mid-grey primary with its ratio and the minimum", () => {
    const [refusal, ...rest] = brandColorRefusals({ primaryColor: "#777777", accentColor: null });
    expect(rest).toEqual([]);
    expect(refusal).toBeInstanceOf(BrandColorContrastError);
    expect(refusal?.code).toBe("brand_color_contrast");
    expect(refusal?.details).toEqual({ ratio: 4.47, minimum: 4.5 });
    expect(refusal?.fieldErrors).toEqual({ primaryColor: "brand_color_contrast" });
  });

  /** The accent needs 3:1 against white; both refusals come back, primary first. */
  it("refuses a light accent, after the primary", () => {
    const refusals = brandColorRefusals({ primaryColor: "#777777", accentColor: "#AAAAAA" });
    expect(refusals.map((refusal) => refusal.fieldErrors)).toEqual([
      { primaryColor: "brand_color_contrast" },
      { accentColor: "brand_color_contrast" },
    ]);
    expect(refusals[1]?.details).toEqual({ ratio: 2.32, minimum: 3 });
  });

  /** The format rule refuses those. */
  it("skips a value that is not #RRGGBB", () => {
    expect(brandColorRefusals({ primaryColor: "grey", accentColor: "#FFF" })).toEqual([]);
  });
});
