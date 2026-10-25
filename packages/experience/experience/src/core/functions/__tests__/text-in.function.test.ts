/**
 * Stackra file contract:
 * Purpose: unit tests of `textIn`: the exact tag first, then its language, then the first locale stored, and `""` for
 *          an empty text.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0162 (decision 2).
 */
import { describe, expect, it } from "@stackra/testing";

import { textIn } from "#core/functions/text-in.function";

describe("textIn", () => {
  const text = { en: "Shirt", ar: "قميص", "ar-SA": "ثوب" };

  it("reads the exact tag, then its language, then the first locale", () => {
    expect(textIn(text, "ar-SA")).toBe("ثوب");
    expect(textIn(text, "ar-EG")).toBe("قميص");
    expect(textIn(text, "fr")).toBe("Shirt");
  });

  it("reads an empty text as an empty string", () => {
    expect(textIn({}, "en")).toBe("");
  });
});
