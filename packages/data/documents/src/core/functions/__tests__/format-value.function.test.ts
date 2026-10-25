/**
 * Stackra file contract:
 * Purpose: unit tests of `formatValue`: strings as they are, numbers and dates through `Intl` in the locale, no text for
 *          an object.
 * Boundary: test only.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0269 (tests import @stackra/testing); ADR 0365.
 */
import { describe, expect, it } from "@stackra/testing";

import { formatValue } from "#core/functions/format-value.function";

describe("formatValue", () => {
  it("formats by type in the locale", () => {
    expect(formatValue("x", "en")).toBe("x");
    expect(formatValue(1234.5, "en-US")).toBe(new Intl.NumberFormat("en-US").format(1234.5));
    expect(formatValue(12n, "ar-EG")).toBe(new Intl.NumberFormat("ar-EG").format(12n));
    expect(formatValue(true, "en")).toBe("true");
    const date = new Date(Date.UTC(2026, 0, 2));
    expect(formatValue(date, "en-GB")).toBe(new Intl.DateTimeFormat("en-GB").format(date));
  });

  it("has no text for an object or an array", () => {
    expect(formatValue({}, "en")).toBeUndefined();
    expect(formatValue([], "en")).toBeUndefined();
  });
});
