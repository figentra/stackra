/**
 * Stackra file contract:
 * Purpose: proves the native renderer writes the Uniwind theme HeroUI Native reads: the radii in `@theme`, and the
 *          same role and shadow variables in the light and dark variants of `@layer theme { :root { … } }`, and that
 *          the committed assets/public/themes/stackra/native.css equals its output byte for byte.
 * Boundary: renders in memory; `vitest run -u` rewrites the committed stylesheet.
 * Runtime: node
 * Governing contract: ADR 0302; ADR 0165 (HeroUI Native and Uniwind on native); ADR 0022 (test placement).
 */
import { ColorRole } from "#contracts/enums/color-role.enum";
import { STACKRA_THEME } from "#core/constants/stackra-theme.constant";
import { renderNativeCss } from "#core/functions/render-native-css.function";

const css = renderNativeCss(STACKRA_THEME);
const variantOf = (mode: "light" | "dark") =>
  css.split(`    @variant ${mode} {\n`)[1]?.split("\n    }")[0] ?? "";
const names = (block: string) => [...block.matchAll(/--([\w-]+):/g)].map((match) => match[1]);

// @covers sta-350:FR-004
describe("renderNativeCss", () => {
  it("matches the committed stylesheet byte for byte", async () => {
    await expect(css).toMatchFileSnapshot("../../../../assets/public/themes/stackra/native.css");
  });

  it("nests both variants in :root inside @layer theme", () => {
    expect(css).toMatch(/\n@layer theme \{\n {2}:root \{\n {4}@variant light \{\n/);
    expect(css).toMatch(/\n\n {4}@variant dark \{\n[\s\S]*\n {4}\}\n {2}\}\n\}\n$/);
  });

  it("defines every colour role and shadow in both variants, and the same set in each", () => {
    for (const mode of ["light", "dark"] as const) {
      const block = variantOf(mode);
      for (const role of ColorRole)
        expect(block, role).toContain(`      --${role}: ${STACKRA_THEME.colors[role][mode]};`);
      for (const shadow of ["surface", "overlay", "field"] as const)
        expect(block).toContain(`--${shadow}-shadow: ${STACKRA_THEME.shadows[shadow][mode]};`);
    }
    expect(names(variantOf("dark"))).toEqual(names(variantOf("light")));
    expect(names(variantOf("light"))).toHaveLength(ColorRole.length + 3);
  });

  it("sets the base and field radius in @theme and leaves web-only tokens out", () => {
    expect(css).toContain("@theme {\n  --radius: 0.25rem;\n  --field-radius: var(--radius);\n}");
    expect(css).not.toMatch(/--font-|--space-|--duration-|--steel/);
  });
});
