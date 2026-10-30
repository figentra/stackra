/**
 * Stackra file contract:
 * Purpose: the contrast matrix of every shipped brand theme: each brand × light/dark × state (default, hover, pressed,
 *          selected, focus ring, disabled) for the pairs the components paint, measured from the token sources (oklch →
 *          sRGB → WCAG ratio, translucent fills composited as the browser does). Prints the table; fails on any pair
 *          under its floor. Disabled rows are printed only (WCAG 1.4.3 exempts inactive controls).
 * Boundary: pure; no DOM. Raw `accent` as text is printed only: components draw accent text with
 *           `accent-soft-foreground`, the contrast-safe accent shade, which is asserted.
 * Runtime: browser
 * Governing contract: ADR 0340 (decision 4); WCAG 2.2 (1.4.3, 1.4.11).
 */
import { contrastRatio, pairRatio } from "@stackra/tokens";
import type { Theme } from "@stackra/tokens/contracts";

import { BRAND_THEMES, buildBrandTheme } from "#src/constants/brand-themes";

const rgb = (hex: string) => [1, 3, 5].map((at) => Number.parseInt(hex.slice(at, at + 2), 16));
const hexOf = (channels: readonly number[]) =>
  `#${channels.map((value) => Math.round(value).toString(16).padStart(2, "0")).join("")}`;

/** `fg` on `bg`, both drawn at `opacity` over the page (HeroUI's disabled look), as a ratio. */
function compositeOver(
  theme: Theme,
  fg: string,
  bg: string,
  opacity: number,
  mode: "light" | "dark",
) {
  const hex = (role: string) => {
    const token = theme.colors[role as keyof Theme["colors"]];
    return (mode === "light" ? token.hexLight : token.hexDark).slice(0, 7);
  };
  const over = (top: string, under: string) =>
    hexOf(rgb(top).map((value, at) => value * opacity + (rgb(under)[at] ?? 0) * (1 - opacity)));
  const page = hex("background");
  return contrastRatio(over(hex(fg), page), over(hex(bg), page));
}

/** [state, fg, bg, floor]; floor 0 prints only. */
const ROWS: readonly (readonly [string, string, string, number])[] = [
  ["solid default/selected", "accent-foreground", "accent", 4.5],
  ["solid hover (web press)", "accent-foreground", "accent-hover", 4.5],
  ["solid pressed (native)", "accent-foreground", "accent-pressed", 4.5],
  ["accent text on bg", "accent-soft-foreground", "background", 4.5],
  ["accent text on surface", "accent-soft-foreground", "surface", 4.5],
  ["secondary btn label", "accent-soft-foreground", "default", 4.5],
  ["secondary btn hover", "accent-soft-foreground", "default-hover", 4.5],
  ["soft accent", "accent-soft-foreground", "accent-soft", 4.5],
  ["soft accent hover", "accent-soft-foreground", "accent-soft-hover", 4.5],
  ["link on bg", "link", "background", 4.5],
  ["link on surface", "link", "surface", 4.5],
  ["focus ring on bg", "focus", "background", 3],
  ["focus ring on surface", "focus", "surface", 3],
  ["danger solid", "danger-foreground", "danger", 4.5],
  ["danger hover", "danger-foreground", "danger-hover", 4.5],
  ["success solid", "success-foreground", "success", 4.5],
  ["success hover", "success-foreground", "success-hover", 4.5],
  ["warning solid", "warning-foreground", "warning", 4.5],
  ["warning hover", "warning-foreground", "warning-hover", 4.5],
  ["field border on surface", "field-border", "surface", 3],
  ["field border on field", "field-border", "field-background", 3],
  ["raw accent as text on bg (info)", "accent", "background", 0],
  ["raw accent as text on surface (info)", "accent", "surface", 0],
];

const MODES = ["light", "dark"] as const;

const matrix = BRAND_THEMES.flatMap(({ id, layer }) => {
  const theme = buildBrandTheme(layer);
  return MODES.flatMap((mode) => [
    ...ROWS.map(([state, fg, bg, min]) => ({
      id,
      mode,
      state,
      pair: `${fg} / ${bg}`,
      ratio: pairRatio(theme, { fg, bg, min: min === 3 ? 3 : 4.5 }, mode) ?? 0,
      min,
    })),
    // HeroUI draws a disabled control at half opacity over the page.
    {
      id,
      mode,
      state: "solid disabled (info)",
      pair: "accent-foreground / accent @50%",
      ratio: compositeOver(theme, "accent-foreground", "accent", 0.5, mode),
      min: 0,
    },
  ]);
});

describe("brand contrast matrix", () => {
  it("prints the matrix", () => {
    const lines = matrix.map(
      ({ id, mode, state, pair, ratio, min }) =>
        `${id.padEnd(9)} ${mode.padEnd(5)} ${state.padEnd(36)} ${pair.padEnd(46)} ${ratio.toFixed(2).padStart(6)}  ${min === 0 ? "info" : ratio >= min ? "pass" : `FAIL <${min}`}`,
    );
    console.log(`\n${lines.join("\n")}\n`);
    expect(lines.length).toBe(BRAND_THEMES.length * 2 * (ROWS.length + 1));
  });

  it.each(
    matrix
      .filter(({ min }) => min > 0)
      .map((row) => [`${row.id} ${row.mode} ${row.state}`, row] as const),
  )("%s holds its floor", (_, { ratio, min }) => {
    expect(ratio).toBeGreaterThanOrEqual(min);
  });
});
