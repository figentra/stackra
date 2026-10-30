/**
 * Stackra file contract:
 * Purpose: unit tests of `numeralsOf`: the `nu` keyword of a tag's `-u-` extension, among other keywords or alone, and
 *          `user` for a tag without one or with a system the setting does not offer.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022; ADR 0192 (decision 2, as amended 2026-10-28).
 */
import { describe, expect, it } from "@stackra/testing";

import { NumberingSystem } from "#core/enums/numbering-system.enum";
import { intlLocale } from "#core/functions/intl-locale.function";
import { numeralsOf } from "#core/functions/numerals-of.function";
import { HourCycle } from "#core/enums/hour-cycle.enum";

describe("numeralsOf", () => {
  it("reads the nu keyword, alone or after another keyword", () => {
    expect(numeralsOf("ar-SA-u-nu-arab")).toBe(NumberingSystem.Arab);
    expect(numeralsOf("en-u-nu-latn")).toBe(NumberingSystem.Latn);
    expect(numeralsOf(intlLocale("de", NumberingSystem.Arab, HourCycle.H23))).toBe(
      NumberingSystem.Arab,
    );
  });

  it("is user without a nu keyword or for another system", () => {
    expect(numeralsOf("ar")).toBe(NumberingSystem.User);
    expect(numeralsOf("en-u-hc-h12")).toBe(NumberingSystem.User);
    expect(numeralsOf("fa-u-nu-arabext")).toBe(NumberingSystem.User);
  });
});
