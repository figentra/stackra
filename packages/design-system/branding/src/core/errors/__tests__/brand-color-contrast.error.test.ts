/**
 * Stackra file contract:
 * Purpose: unit tests of `BrandColorContrastError`: a validation refusal coded `brand_color_contrast`, not retryable,
 *          whose envelope carries the ratio and the minimum.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0140.
 */
import { ErrorKind } from "@stackra/errors";
import { describe, expect, it } from "@stackra/testing";

import { BrandColorContrastError } from "#core/errors/brand-color-contrast.error";

/** The contrast refusal. */
describe("BrandColorContrastError", () => {
  /** Code, kind and details on the wire. */
  it("is a validation refusal that names the ratio and the minimum", () => {
    const refusal = BrandColorContrastError.create({ ratio: 2.32, minimum: 3 });
    expect(refusal.code).toBe("brand_color_contrast");
    expect(refusal.kind).toBe(ErrorKind.Validation);
    expect(refusal.retryable).toBe(false);
    expect(refusal.toEnvelope()).toMatchObject({
      code: "brand_color_contrast",
      details: { ratio: 2.32, minimum: 3 },
    });
  });
});
