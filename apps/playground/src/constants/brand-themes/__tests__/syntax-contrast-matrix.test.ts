/**
 * Stackra file contract:
 * Purpose: the syntax contrast matrix of every shipped brand theme: each brand × light/dark × syntax role, measured on
 *          the code background (`surface-secondary`) and under the 10% line tints a code block paints (an accent
 *          highlighted line, an inserted and a deleted line). Prints the table; fails on any role under 4.5:1.
 * Boundary: pure; no DOM.
 * Runtime: browser
 * Governing contract: WCAG 2.2 SC 1.4.3; STA-1371.
 */
import { contrastRatio, syntaxColours } from "@stackra/tokens";
import { SyntaxRole } from "@stackra/tokens/contracts";

import { BRAND_THEMES, buildBrandTheme } from "#src/constants/brand-themes";

const rgb = (hex: string) => [1, 3, 5].map((at) => Number.parseInt(hex.slice(at, at + 2), 16));
/** `top` at 10% over `under`, as `color-mix(in srgb, top 10%, transparent)` paints on `under`. */
const tint = (top: string, under: string) =>
  `#${rgb(top)
    .map((value, at) => Math.round(value * 0.1 + (rgb(under)[at] ?? 0) * 0.9))
    .map((value) => value.toString(16).padStart(2, "0"))
    .join("")}`;

const MODES = ["light", "dark"] as const;

const matrix = BRAND_THEMES.flatMap(({ id, layer }) => {
  const theme = buildBrandTheme(layer);
  return MODES.flatMap((mode) => {
    const hex = (role: "surface-secondary" | "accent") =>
      (mode === "light" ? theme.colors[role].hexLight : theme.colors[role].hexDark).slice(0, 7);
    const colours = syntaxColours(theme, mode);
    const background = hex("surface-secondary");
    const unders = [
      background,
      ...[hex("accent"), colours.inserted, colours.deleted].map((on) => tint(on, background)),
    ];
    return SyntaxRole.map((role) => ({
      id,
      mode,
      role,
      colour: colours[role],
      ratio: Math.min(...unders.map((under) => contrastRatio(colours[role], under))),
    }));
  });
});

describe("brand syntax contrast matrix", () => {
  it("prints the matrix", () => {
    const lines = matrix.map(
      ({ id, mode, role, colour, ratio }) =>
        `${id.padEnd(9)} ${mode.padEnd(5)} ${role.padEnd(12)} ${colour} ${ratio.toFixed(2).padStart(6)}  ${ratio >= 4.5 ? "pass" : "FAIL <4.5"}`,
    );
    console.log(`\n${lines.join("\n")}\n`);
    expect(lines.length).toBe(BRAND_THEMES.length * 2 * SyntaxRole.length);
  });

  it.each(matrix.map((row) => [`${row.id} ${row.mode} ${row.role}`, row] as const))(
    "%s holds 4.5:1",
    (_, { ratio }) => {
      expect(ratio).toBeGreaterThanOrEqual(4.5);
    },
  );
});
