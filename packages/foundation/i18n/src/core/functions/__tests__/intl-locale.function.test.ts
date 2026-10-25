/**
 * Stackra file contract:
 * Purpose: unit tests of `intlLocale`: Latin and Arabic-Indic digits become the `-u-nu-` extension Intl applies, and
 *          the user's own digits add nothing.
 * Boundary: test only.
 * Runtime: node (vitest, full ICU)
 * Governing contract: ADR 0022; ADR 0269; ADR 0192 (decision 2).
 */
import { describe, expect, it } from "@stackra/testing";

import { NumberingSystem } from "#core/enums/numbering-system.enum";
import { intlLocale } from "#core/functions/intl-locale.function";

describe("intlLocale", () => {
  it("adds the nu extension for a forced numbering system", () => {
    expect(intlLocale("ar-SA", NumberingSystem.Latn)).toBe("ar-SA-u-nu-latn");
    expect(intlLocale("en", NumberingSystem.Arab)).toBe("en-u-nu-arab");
    expect(new Intl.NumberFormat(intlLocale("ar", NumberingSystem.Latn)).format(42)).toBe("42");
  });

  it("leaves the locale alone for the user's own digits", () => {
    expect(intlLocale("ar", NumberingSystem.User)).toBe("ar");
  });
});
