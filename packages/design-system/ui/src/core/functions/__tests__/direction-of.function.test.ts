/**
 * Stackra file contract:
 * Purpose: proves `directionOf` reads a locale's direction from Intl, falls back to the script list when Intl has no
 *          text info, and treats an invalid locale as left-to-right.
 * Boundary: pure function; stubs Intl.Locale for the fallback.
 * Runtime: node
 * Governing contract: ADR 0302 (decision 3); ADR 0022 (test placement).
 */
// @covers sta-350:FR-007
import { directionOf } from "#core/functions/direction-of.function";

describe("directionOf", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it.each([
    ["en", "ltr"],
    ["en-GB", "ltr"],
    ["ar", "rtl"],
    ["ar-EG", "rtl"],
    ["he", "rtl"],
    ["fa-IR", "rtl"],
    ["ur", "rtl"],
    ["ja", "ltr"],
  ] as const)("%s is %s", (locale, direction) => {
    expect(directionOf(locale)).toBe(direction);
  });

  it("is ltr for an invalid locale", () => {
    expect(directionOf("not a locale!")).toBe("ltr");
  });

  it("falls back to the script when Intl.Locale has no text info", () => {
    class BareLocale extends Intl.Locale {
      getTextInfo = undefined;

      textInfo = undefined;
    }
    vi.stubGlobal("Intl", { ...Intl, Locale: BareLocale });
    expect(directionOf("ar")).toBe("rtl");
    expect(directionOf("sr-Cyrl")).toBe("ltr");
  });
});
