/**
 * Stackra file contract:
 * Purpose: proves `textDirectionOf` takes the direction from the first letter, skipping digits and punctuation, and
 *          gives none for a text without letters.
 * Boundary: pure function, no DOM.
 * Runtime: node
 * Governing contract: ADR 0060; ADR 0022 (test placement); STA-1371.
 */
import { textDirectionOf } from "#core/functions/text-direction-of.function";

describe("textDirectionOf", () => {
  it("reads the first letter", () => {
    expect(textDirectionOf("12. مرحبا Hello")).toBe("rtl");
    expect(textDirectionOf("«Hello» مرحبا")).toBe("ltr");
    expect(textDirectionOf("שלום")).toBe("rtl");
    expect(textDirectionOf("42 — !")).toBeUndefined();
  });
});
