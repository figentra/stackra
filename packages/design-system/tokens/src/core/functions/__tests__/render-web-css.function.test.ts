/**
 * Stackra file contract:
 * Purpose: proves the web renderer writes every HeroUI v3 colour role, palette colour and shadow for both modes
 *          under the selectors HeroUI's theming docs prescribe, and that the committed
 *          assets/public/themes/stackra/web.css equals its output byte for byte.
 * Boundary: renders in memory; `vitest run -u` rewrites the committed stylesheet.
 * Runtime: node
 * Governing contract: ADR 0302; ADR 0165 (HeroUI v3 on the web); ADR 0022 (test placement).
 */
import { ColorRole } from "#contracts/enums/color-role.enum";
import { STACKRA_THEME } from "#core/constants/stackra-theme.constant";
import { renderWebCss } from "#core/functions/render-web-css.function";

const css = renderWebCss(STACKRA_THEME);
const blockOf = (selector: string) => css.split(`${selector} {\n`)[1]?.split("\n}")[0] ?? "";

// @covers sta-350:FR-003
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
      "@media (prefers-reduced-motion: reduce) {\n  :root {\n    --duration-fast: 0ms;\n    --duration-base: 0ms;\n    --duration-blink: 0ms;\n  }\n}",
    );
    expect(css).toContain(":root:lang(ar) {\n  font-family: var(--font-arabic);\n}");
  });
});
