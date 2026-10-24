/**
 * Stackra file contract:
 * Purpose: proves checkSeparation keeps the old rule: an accent within 25 degrees of hue and 0.1 of lightness of a
 *          neighbour is found in that scheme; enough lightness alone separates; and a near-grey colour is judged by
 *          lightness only, since its hue means nothing.
 * Boundary: in-memory themes only.
 * Runtime: node
 * Governing contract: ADR 0340 (decision 5); ADR 0022 (test placement).
 */
import type { Theme } from "#contracts/types/theme.type";
import { STACKRA_THEME } from "#core/constants/stackra-theme.constant";
import { checkSeparation } from "#core/functions/check-separation.function";
import { oklchToHex } from "#core/functions/oklch-to-hex.function";

const withAccent = (light: string, dark: string): Theme => ({
  ...STACKRA_THEME,
  colors: {
    ...STACKRA_THEME.colors,
    accent: { light, dark, hexLight: oklchToHex(light), hexDark: oklchToHex(dark) },
  },
});

const RULE = [{ subject: "accent", from: ["warning"] }];

describe("checkSeparation", () => {
  it("finds an accent close to the warning colour in hue and lightness", () => {
    const findings = checkSeparation(
      withAccent("oklch(0.55 0.15 52)", "oklch(0.72 0.15 52)"),
      RULE,
    );
    expect(findings.map((finding) => [finding.code, finding.mode])).toEqual([
      ["accent_not_separated", "light"],
      ["accent_not_separated", "dark"],
    ]);
  });

  it("lets enough lightness separate a near hue", () => {
    expect(checkSeparation(withAccent("oklch(0.3 0.12 52)", "oklch(0.9 0.08 52)"), RULE)).toEqual(
      [],
    );
  });

  it("judges a near-grey accent by lightness alone", () => {
    const grey = withAccent("oklch(0.56 0.01 47)", "oklch(0.95 0.01 47)");
    expect(checkSeparation(grey, RULE).map((finding) => finding.mode)).toEqual(["light"]);
  });

  it("checks nothing without rules", () => {
    expect(checkSeparation(STACKRA_THEME, [])).toEqual([]);
  });
});
