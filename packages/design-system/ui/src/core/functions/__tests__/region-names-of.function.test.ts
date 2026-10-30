/**
 * Stackra file contract:
 * Purpose: proves `regionNamesOf` names a region in the locale, and keeps every code on a
 *          runtime without Intl.DisplayNames (Hermes), where it used to throw.
 * Boundary: pure; swaps Intl.DisplayNames out for the one case and restores it.
 * Runtime: node
 * Governing contract: ADR 0022 (test placement); STA-1371.
 */
import { regionNamesOf } from "#core/functions/region-names-of.function";

describe("regionNamesOf", () => {
  it("names a region in the locale", () => {
    expect(regionNamesOf("en")("SA")).toBe("Saudi Arabia");
    expect(regionNamesOf("ar")("SA")).toBe("المملكة العربية السعودية");
  });

  it("keeps the code where the runtime has no Intl.DisplayNames, as on Hermes", () => {
    vi.stubGlobal("Intl", { ...Intl, DisplayNames: undefined });
    try {
      expect(regionNamesOf("ar")("EG")).toBe("EG");
    } finally {
      vi.unstubAllGlobals();
    }
  });
});
