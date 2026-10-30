/**
 * Stackra file contract:
 * Purpose: unit tests of `withNumerals`: a formatted Latin number written in Arabic-Indic digits and marks, back
 *          again, marks outside numbers left alone, and the user's choice left alone.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0192 (decision 2).
 */
import { describe, expect, it } from "@stackra/testing";

import { NumberingSystem } from "#core/enums/numbering-system.enum";
import { withNumerals } from "#core/functions/with-numerals.function";

describe("withNumerals", () => {
  it("writes a formatted number in Arabic-Indic digits and marks, and back", () => {
    expect(withNumerals("1,310.00 US$", NumberingSystem.Arab)).toBe("١٬٣١٠٫٠٠ US$");
    expect(withNumerals("١٬٣١٠٫٠٠ US$", NumberingSystem.Latn)).toBe("1,310.00 US$");
  });

  it("changes a mark only between digits, and leaves the user's choice alone", () => {
    expect(withNumerals("v2.14, 5.", NumberingSystem.Arab)).toBe("v٢٫١٤, ٥.");
    expect(withNumerals("1,310.00", NumberingSystem.User)).toBe("1,310.00");
  });
});
