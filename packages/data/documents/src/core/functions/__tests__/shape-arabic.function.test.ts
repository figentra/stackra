/**
 * Stackra file contract:
 * Purpose: unit tests of `shapeArabic`: initial, medial, final and isolated forms, the lam-alef ligature, right-joining
 *          letters, transparent harakat and text outside Arabic.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0365.
 */
import { describe, expect, it } from "@stackra/testing";

import { shapeArabic } from "#core/functions/shape-arabic.function";

describe("shapeArabic", () => {
  it("picks each letter's contextual form", () => {
    expect(shapeArabic("بيت")).toBe("ﺑﻴﺖ");
    expect(shapeArabic("ب")).toBe("ﺏ");
    expect(shapeArabic("دب")).toBe("ﺩﺏ");
  });

  it("joins lam and alef", () => {
    expect(shapeArabic("سلام")).toBe("ﺳﻼﻡ");
    expect(shapeArabic("لا")).toBe("ﻻ");
  });

  it("joins across harakat and leaves other text alone", () => {
    expect(shapeArabic("بَت")).toBe("ﺑَﺖ");
    expect(shapeArabic("Total 12")).toBe("Total 12");
  });
});
