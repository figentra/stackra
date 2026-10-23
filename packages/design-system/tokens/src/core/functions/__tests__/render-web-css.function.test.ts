/**
 * Stackra file contract:
 * Purpose: proves the web renderer writes every HeroUI v3 colour role, palette colour and shadow for both modes
 *          under the selectors HeroUI's theming docs prescribe, that one `@layer components` block draws HeroUI's
 *          Typography classes in the theme's type scale (with Arabic twins and the weight modifiers), and that the committed
 *          assets/public/themes/stackra/web.css equals its output byte for byte.
 * Boundary: renders in memory; `vitest run -u` rewrites the committed stylesheet.
 * Runtime: node
 * Governing contract: ADR 0302; ADR 0165 (HeroUI v3 on the web); ADR 0022 (test placement).
 */
import { ColorRole } from "#contracts/enums/color-role.enum";
import type { Theme } from "#contracts/types/theme.type";
import { STACKRA_THEME } from "#core/constants/stackra-theme.constant";
import { renderWebCss } from "#core/functions/render-web-css.function";

const css = renderWebCss(STACKRA_THEME);
const blockOf = (selector: string) => css.split(`${selector} {\n`)[1]?.split("\n}")[0] ?? "";

const layer = css.split("@layer components {\n")[1]?.split("\n}\n")[0] ?? "";

// @covers sta-350:FR-003 sta-350:FR-020
describe("renderWebCss", () => {
  it("matches the committed stylesheet byte for byte", async () => {
    await expect(css).toMatchFileSnapshot("../../../../assets/public/themes/stackra/web.css");
  });

  it("puts light colours on :root and [data-theme=light], dark on .dark and [data-theme=dark]", () => {
    for (const [selector, mode] of [
      [':root,\n[data-theme="light"]', "light"],
      ['.dark,\n[data-theme="dark"]', "dark"],
    ] as const) {
      const block = blockOf(selector);
      for (const role of ColorRole)
        expect(block, role).toContain(`  --${role}: ${STACKRA_THEME.colors[role][mode]};\n`);
      for (const [name, token] of Object.entries(STACKRA_THEME.palette))
        expect(block, name).toContain(`  --${name}: ${token[mode]};\n`);
      for (const shadow of ["surface", "overlay", "field"] as const)
        expect(block).toContain(`  --${shadow}-shadow: ${STACKRA_THEME.shadows[shadow][mode]};`);
    }
  });

  it("puts fonts, type, spacing, radius and motion on :root once", () => {
    const root = blockOf(":root");
    expect(root).toContain('  --font-sans: "Geist", ui-sans-serif, system-ui, sans-serif;');
    expect(root).toContain("  --h1-ar: 600 38px/1.35 var(--font-arabic);");
    expect(root).toContain("  --label-letter-spacing: 0.06em;");
    expect(root).toContain("  --space-4: 16px;");
    expect(root).toContain("  --radius: 0.25rem;\n  --field-radius: var(--radius);");
    expect(root).toContain("  --radius-app-tile: 21.875%;");
    expect(root).toContain("  --duration-fast: 150ms;\n  --ease-fast: ease-out;");
    expect(root).not.toContain("--background");
  });

  it("stops motion under prefers-reduced-motion and sets the Arabic stack for lang(ar)", () => {
    expect(css).toContain(
      "@media (prefers-reduced-motion: reduce) {\n  :root {\n    --duration-fast: 0ms;\n    --duration-base: 0ms;\n    --duration-blink: 0ms;\n  }\n",
    );
    expect(css).toContain(":root:lang(ar) {\n  font-family: var(--font-arabic);\n}");
  });

  it("sweeps a skeleton from the inline-start side and stops every skeleton animation under reduced motion", () => {
    // @covers sta-350:FR-045
    const shimmer = '.skeleton--shimmer:is(:dir(rtl), [dir="rtl"], [dir="rtl"] *)';
    const rtl = css.split(`${shimmer}::after,\n${shimmer}::before {\n`)[1];
    expect(rtl?.startsWith("  animation-direction: reverse;\n}")).toBe(true);
    // Unlayered: the rule sits before the `components` layer, so it beats HeroUI's animation.
    expect(css.indexOf(shimmer)).toBeLessThan(css.indexOf("@layer components"));
    expect(css.match(/@media \(prefers-reduced-motion/g)).toHaveLength(1);
    const motion =
      css.split("@media (prefers-reduced-motion: reduce) {")[1]?.split("\n}\n")[0] ?? "";
    expect(motion).toContain("--duration-fast: 0ms;");
    expect(motion).toContain(
      "  .skeleton--shimmer::after,\n  .skeleton--shimmer::before,\n  .skeleton--pulse {\n    animation: none;\n  }",
    );
  });

  it("draws HeroUI's Typography classes in the theme's scale inside one components layer", () => {
    expect(css.match(/@layer components \{/g)).toHaveLength(1);
    expect(layer).toContain(
      "  .typography--h1 {\n    font: var(--h1);\n    letter-spacing: var(--h1-letter-spacing);\n  }",
    );
    expect(layer).toContain(
      "  .typography--h1:where(:lang(ar)) {\n    font: var(--h1-ar);\n    letter-spacing: var(--h1-ar-letter-spacing);\n  }",
    );
    // `small` and `caption` are the theme's names for HeroUI's body-sm and body-xs.
    expect(layer).toContain("  .typography--body-sm {\n    font: var(--small);");
    expect(layer).toContain("  .typography--body-xs {\n    font: var(--caption);");
    expect(layer).toContain("  .typography--h6:where(:lang(ar)) {\n    font: var(--h6-ar);");
  });

  it("states HeroUI's weight modifiers after the last type rule", () => {
    const lastType = layer.lastIndexOf(".typography--body-xs:where(:lang(ar))");
    for (const [name, weight] of [
      ["normal", 400],
      ["medium", 500],
      ["semibold", 600],
      ["bold", 700],
    ] as const) {
      const at = layer.indexOf(`.typography--weight-${name} {\n    font-weight: ${weight};`);
      expect(at, name).toBeGreaterThan(lastType);
    }
  });

  it("writes no rule for a type the theme does not define, nor an Arabic twin it lacks", () => {
    const { h4, "h4-ar": _arabic, ...typography } = STACKRA_THEME.typography;
    const withoutH4 = renderWebCss({ ...STACKRA_THEME, typography } as Theme);
    expect(h4).toBeDefined();
    expect(withoutH4).not.toContain(".typography--h4");
    expect(withoutH4).toContain(".typography--h5 {");
    const { "h5-ar": _twin, ...noTwin } = STACKRA_THEME.typography;
    expect(renderWebCss({ ...STACKRA_THEME, typography: noTwin } as Theme)).not.toContain(
      ".typography--h5:where(:lang(ar))",
    );
  });
});
