/**
 * Stackra file contract:
 * Purpose: unit tests of `checkImageVariant`: whole positive pixels and a known format pass; anything else is a
 *          `RangeError` naming where the variant came from.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0222 (decision 4).
 */
import { describe, expect, it } from "@stackra/testing";

import { ImageFormat } from "#core/enums/image-format.enum";
import { checkImageVariant } from "#core/functions/check-image-variant.function";

describe("checkImageVariant", () => {
  it("passes a whole box and a known format", () => {
    expect(() =>
      checkImageVariant("here", { width: 480, height: 480, format: ImageFormat.Avif }),
    ).not.toThrow();
    expect(() => checkImageVariant("here", { width: 1 })).not.toThrow();
  });

  it.each([
    [{ width: 0 }, /here: width/],
    [{ width: 1.5 }, /here: width/],
    [{ width: 10, height: -1 }, /here: height/],
    [{ width: 10, format: "tiff" as ImageFormat }, /here: format/],
  ])("refuses %j", (variant, message) => {
    expect(() => checkImageVariant("here", variant)).toThrow(RangeError);
    expect(() => checkImageVariant("here", variant)).toThrow(message);
  });
});
