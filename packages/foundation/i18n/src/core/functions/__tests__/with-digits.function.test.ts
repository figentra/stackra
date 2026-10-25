/**
 * Stackra file contract:
 * Purpose: unit tests of `withDigits`: Arabic-Indic and Eastern digits read as Latin, Latin and Eastern written as
 *          Arabic-Indic, and the user's choice left alone.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0269; ADR 0192 (decision 2).
 */
import { describe, expect, it } from "@stackra/testing";

import { NumberingSystem } from "#core/enums/numbering-system.enum";
import { withDigits } from "#core/functions/with-digits.function";

describe("withDigits", () => {
  it("switches digits only", () => {
    expect(withDigits("رقم ١٢٣ و ۴۵", NumberingSystem.Latn)).toBe("رقم 123 و 45");
    expect(withDigits("Order 45 ۶", NumberingSystem.Arab)).toBe("Order ٤٥ ٦");
    expect(withDigits("١ 2", NumberingSystem.User)).toBe("١ 2");
  });
});
