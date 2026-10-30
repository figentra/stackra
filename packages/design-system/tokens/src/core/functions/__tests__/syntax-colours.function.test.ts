/**
 * Stackra file contract:
 * Purpose: proves `syntaxColours` gives every syntax role at least 4.5:1 on the code background of the stackra theme in
 *          both schemes, also under a 10% line tint (an accent highlighted line, inserted and deleted lines), and leans keywords to
 *          the accent. Every brand is measured by the playground's syntax contrast matrix.
 * Boundary: pure.
 * Runtime: isomorphic
 * Governing contract: WCAG 2.2 SC 1.4.3; STA-1371.
 */
import { SyntaxRole } from "#contracts/enums/syntax-role.enum";
import { STACKRA_THEME } from "#core/constants/stackra-theme.constant";
import { contrastRatio } from "#core/functions/contrast-ratio.function";
import { deriveTheme } from "#core/functions/derive-theme.function";
import { syntaxColours } from "#core/functions/syntax-colours.function";

const rgb = (hex: string) => [1, 3, 5].map((at) => Number.parseInt(hex.slice(at, at + 2), 16));
/** `top` at `share` over `under`, as `color-mix(in srgb, top share, transparent)` paints on `under`. */
const tint = (top: string, under: string, share: number) =>
  `#${rgb(top)
    .map((value, at) => Math.round(value * share + (rgb(under)[at] ?? 0) * (1 - share)))
    .map((value) => value.toString(16).padStart(2, "0"))
    .join("")}`;

describe("syntaxColours", () => {
  it.each(["light", "dark"] as const)(
    "holds 4.5:1 on the %s code background and its tints",
    (mode) => {
      const colours = syntaxColours(STACKRA_THEME, mode);
      const token = STACKRA_THEME.colors["surface-secondary"];
      const background = (mode === "light" ? token.hexLight : token.hexDark).slice(0, 7);
      const accent = STACKRA_THEME.colors.accent;
      const lineAccent = (mode === "light" ? accent.hexLight : accent.hexDark).slice(0, 7);
      const tints = [lineAccent, colours.inserted, colours.deleted].map((on) =>
        tint(on, background, 0.1),
      );
      for (const role of SyntaxRole) {
        for (const under of [background, ...tints]) {
          expect(contrastRatio(colours[role], under), `${role} on ${under}`).toBeGreaterThanOrEqual(
            4.5,
          );
        }
      }
    },
  );

  it("follows the accent's hue for keywords only", () => {
    const green = deriveTheme(STACKRA_THEME, { accent: { hue: 145, chroma: 0.15 } });
    const base = syntaxColours(STACKRA_THEME, "light");
    const derived = syntaxColours(green, "light");
    expect(derived.keyword).not.toBe(base.keyword);
    expect(derived.string).toBe(base.string);
  });
});
