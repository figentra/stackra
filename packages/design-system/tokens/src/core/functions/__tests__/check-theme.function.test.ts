/**
 * Stackra file contract:
 * Purpose: proves checkTheme measures what is painted: the stackra theme meets every default pair in both schemes;
 *          a pair under its minimum is found with its ratio; a hex that is not its oklch value is found; HeroUI's
 *          derived soft fill is composited over the page before it is measured; and a page that cannot be measured is
 *          reported, not thrown.
 * Boundary: in-memory themes only.
 * Runtime: node
 * Governing contract: ADR 0340 (decisions 3 and 4); ADR 0022 (test placement).
 */
import type { ColorToken, Theme } from "#contracts/types/theme.type";
import { STACKRA_THEME } from "#core/constants/stackra-theme.constant";
import { checkTheme } from "#core/functions/check-theme.function";
import { oklchToHex } from "#core/functions/oklch-to-hex.function";
import { pairRatio } from "#core/functions/pair-ratio.function";

const token = (light: string, dark: string): ColorToken => ({
  light,
  dark,
  hexLight: oklchToHex(light),
  hexDark: oklchToHex(dark),
});

const withColor = (role: string, value: ColorToken): Theme => ({
  ...STACKRA_THEME,
  colors: { ...STACKRA_THEME.colors, [role]: value },
});

describe("checkTheme", () => {
  it("finds nothing on the stackra theme: every default pair holds in both schemes, every hex is its oklch", () => {
    expect(checkTheme(STACKRA_THEME)).toEqual([]);
  });

  it("finds a pair under its minimum, with the ratio measured", () => {
    const pale = withColor("muted", token("oklch(0.8 0.01 250)", "oklch(0.72 0.008 250)"));
    const findings = checkTheme(pale, [{ fg: "muted", bg: "background", min: 4.5 }]);
    expect(findings).toHaveLength(1);
    expect(findings[0]).toMatchObject({ code: "contrast_too_low", path: "muted", mode: "light" });
    expect(findings[0]?.ratio).toBeLessThan(4.5);
  });

  it("finds a hex that is not its oklch value", () => {
    const drifted = withColor("accent", { ...STACKRA_THEME.colors.accent, hexLight: "#123456" });
    expect(checkTheme(drifted, [])).toEqual([
      expect.objectContaining({ code: "hex_drift", path: "colors.accent.hexLight", mode: "light" }),
    ]);
  });

  it("composites HeroUI's translucent soft fill over the page before measuring", () => {
    const soft = pairRatio(
      STACKRA_THEME,
      { fg: "warning-soft-foreground", bg: "warning-soft", min: 4.5 },
      "light",
    );
    expect(soft).toBeGreaterThan(4.5);
  });

  it("reports a pair it cannot measure instead of throwing", () => {
    const findings = checkTheme(STACKRA_THEME, [
      { fg: "no-such-colour", bg: "background", min: 4.5 },
    ]);
    expect(findings.map((finding) => finding.code)).toEqual([
      "colour_not_measurable",
      "colour_not_measurable",
    ]);
  });
});
