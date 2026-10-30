/**
 * Stackra file contract:
 * Purpose: proves the web renderer writes every HeroUI v3 colour role, palette colour and shadow for both modes
 *          under the selectors HeroUI's theming docs prescribe, that one `@layer components` block draws HeroUI's
 *          Typography classes in the theme's type scale (with Arabic twins and the weight modifiers) and the glass
 *          material's classes, that the material's levels, modes and fallbacks are written (ADR 0320), and that the committed
 *          assets/public/themes/stackra/web.css equals its output byte for byte. The headings draw the display stacks
 *          (STA-1386).
 * Boundary: renders in memory; `vitest run -u` rewrites the committed stylesheet.
 * Runtime: node
 * Governing contract: ADR 0302; ADR 0165 (HeroUI v3 on the web); ADR 0022 (test placement).
 */
import { ColorRole } from "#contracts/enums/color-role.enum";
import { MaterialLevel } from "#contracts/enums/material-level.enum";
import { MaterialMode } from "#contracts/enums/material-mode.enum";
import type { Theme } from "#contracts/types/theme.type";
import { MATERIAL_MODES } from "#core/constants/material-modes.constant";
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
    expect(root).toContain('  --font-display: "Geist", ui-sans-serif, system-ui, sans-serif;');
    expect(root).toContain("  --h1: 600 40px/1.1 var(--font-display);");
    expect(root).toContain("  --h1-ar: 600 38px/1.35 var(--font-display-arabic);");
    expect(root).toContain("  --body-ar: 400 17px/1.8 var(--font-arabic);");
    expect(root).toContain("  --label-letter-spacing: 0.06em;");
    expect(root).toContain("  --space-4: 16px;");
    expect(root).toContain("  --radius: 0.25rem;\n  --field-radius: var(--radius);");
    expect(root).toContain("  --radius-app-tile: 21.875%;");
    expect(root).toContain("  --duration-fast: 150ms;\n  --ease-fast: ease-out;");
    expect(root).not.toContain("--background");
  });

  it("stops motion under prefers-reduced-motion and sets the Arabic stack for lang(ar)", () => {
    expect(css).toContain(
      "@media (prefers-reduced-motion: reduce) {\n  :root {\n    --duration-fast: 0ms;\n    --duration-base: 0ms;\n    --duration-blink: 0ms;\n    --duration-reveal: 0ms;\n    --duration-stagger: 0ms;\n  }\n",
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

  it("ends every transition and animation at once under data-motion none", () => {
    expect(css).toContain(
      'html[data-motion="none"] {\n  --duration-fast: 0ms;\n  --duration-base: 0ms;\n  --duration-blink: 0ms;\n  --duration-reveal: 0ms;\n  --duration-stagger: 0ms;\n  scroll-behavior: auto;\n}',
    );
    const all = css.split('html[data-motion="none"] *::after {\n')[1]?.split("\n}")[0] ?? "";
    expect(all).toContain("animation-duration: 0s !important;");
    expect(all).toContain("transition-duration: 0s !important;");
    // Unlayered and outside the components layer, so it beats every component's own timing.
    expect(css.indexOf('html[data-motion="none"] *')).toBeLessThan(
      css.indexOf("@layer components"),
    );
  });

  it("draws HeroUI's Typography classes in the theme's scale inside the one components layer", () => {
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

  it("writes each material level's share, fill and filter in both colour blocks, and its blur and saturation once", () => {
    const light = blockOf(':root,\n[data-theme="light"]');
    const dark = blockOf('.dark,\n[data-theme="dark"]');
    for (const level of MaterialLevel) {
      const token = STACKRA_THEME.materials.levels[level];
      expect(light).toContain(`  --material-${level}-share: ${token.fill.light};`);
      expect(dark).toContain(`  --material-${level}-share: ${token.fill.dark};`);
      for (const block of [light, dark]) {
        // The thick level, which muted text sits on, also takes the mode's thick floor (solid in liquid).
        const floor =
          level === "thick"
            ? "max(var(--material-fill-floor), var(--material-thick-floor))"
            : "var(--material-fill-floor)";
        expect(block).toContain(
          `  --material-${level}-fill: color-mix(in oklch, var(--surface) calc(clamp(${floor}, var(--material-${level}-share) * var(--material-fill-scale), 1) * 100%), transparent);`,
        );
        expect(block).toContain(
          `  --material-${level}-filter: blur(calc(var(--material-${level}-blur)`,
        );
      }
      expect(blockOf(":root")).toContain(`  --material-${level}-blur: ${token.blur};`);
    }
    expect(dark).toContain(
      `  --material-highlight-share: ${STACKRA_THEME.materials.highlight.dark};`,
    );
    // The sheen is the rim light spread down, so it takes the scheme's rim-light share: faint on a dark scheme.
    for (const block of [light, dark])
      expect(block).toContain(
        "  --material-sheen-color: color-mix(in oklch, oklch(1 0 0) calc(var(--material-sheen) * var(--material-highlight-share) * 100%), transparent);",
      );
  });

  it("writes every mode's factors on [data-material], glass also on :root as the default", () => {
    for (const mode of MaterialMode) {
      const factors = MATERIAL_MODES[mode];
      const block = blockOf(`[data-material="${mode}"]`);
      expect(block, mode).toContain(`  --material-fill-floor: ${factors.fillFloor};`);
      expect(block, mode).toContain(`  --material-thick-floor: ${factors.thickFloor};`);
      expect(block, mode).toContain(`  --material-sheen: ${factors.sheen};`);
    }
    expect(blockOf(":root")).toContain("  --material-fill-floor: 0;");
    expect(blockOf(":root")).toContain("  --material-thick-floor: 0;");
    expect(MATERIAL_MODES.solid).toMatchObject({ fillFloor: 1, thickFloor: 1, blurScale: 0 });
  });

  it("draws the material classes in the components layer, the regular level as .material", () => {
    expect(layer).toContain(
      "  .material,\n  .material-regular {\n    background-color: var(--material-regular-fill);",
    );
    expect(layer).toContain("  .material-thin {\n    background-color: var(--material-thin-fill);");
    expect(layer).toContain("    backdrop-filter: var(--material-thick-filter);");
    expect(layer).toContain("    border: 1px solid var(--material-edge);");
  });

  it("draws the bar material as the theme's background glass with foreground text, solid without color-mix", () => {
    expect(layer).toContain(
      "  .material-bar {\n    background-color: var(--background);\n    color: var(--foreground);\n  }",
    );
    // The mode's floor lifts the share: the solid mode (and so reduced transparency and more contrast) is opaque.
    expect(layer).toContain(
      "      background-color: color-mix(in oklch, var(--background) calc(max(var(--material-fill-floor), 0.88) * 100%), transparent);",
    );
  });

  it("turns the material solid under reduced transparency, more contrast and no backdrop filter", () => {
    expect(css).toContain(
      "@media (prefers-reduced-transparency: reduce), (prefers-contrast: more) {\n  :root,\n  [data-material] {\n    --material-fill-scale: 1;\n    --material-fill-floor: 1;\n    --material-thick-floor: 1;\n    --material-blur-scale: 0;",
    );
    expect(css).toContain(
      "@supports not ((backdrop-filter: blur(1px)) or (-webkit-backdrop-filter: blur(1px))) {\n  :root,\n  [data-material] {\n    --material-fill-scale: 1;\n    --material-fill-floor: 1;",
    );
    expect(css).toContain("@media (forced-colors: active) {");
    // The fallbacks come after the mode blocks, so they win at equal specificity.
    expect(css.indexOf("prefers-reduced-transparency")).toBeGreaterThan(
      css.indexOf('[data-material="liquid"]'),
    );
  });

  it("gives a browser without color-mix a static, opaque material after the colour blocks", () => {
    const query =
      "@supports not (color: color-mix(in oklch, white, black)) {\n  :root,\n  .dark,\n  [data-theme] {\n";
    const fallback = css.split(query)[1]?.split("\n  }\n}")[0] ?? "";
    for (const level of MaterialLevel) {
      expect(fallback).toContain(`    --material-${level}-fill: var(--surface);`);
      expect(fallback).toContain(`    --material-${level}-filter: none;`);
    }
    expect(fallback).toContain("    --material-edge: var(--border);");
    expect(fallback).toContain("    --material-sheen-color: transparent;");
    // Equal specificity to the colour blocks (one class or attribute), so coming later is what makes it win.
    expect(css.indexOf(query)).toBeGreaterThan(css.indexOf('.dark,\n[data-theme="dark"] {'));
  });

  // @covers sta-425:FR-002 sta-425:P-002
  it("puts the quiet button variants and the close button on the control fill with no backdrop filter (ADR 0319)", () => {
    expect(layer).toContain(
      "  .button--secondary,\n  .button--tertiary,\n  .button--outline {\n    --button-bg: var(--material-control-fill);",
    );
    expect(layer).toContain('  .button--ghost:hover,\n  .button--ghost[data-hovered="true"],');
    expect(layer).toContain(
      "  .close-button--default {\n    background-color: var(--material-control-fill);",
    );
    expect(layer).not.toContain(".button--primary");
    // One box for every variant: the solid ones keep a transparent border the width of the outlined ones' edge.
    expect(layer).toContain("  .button {\n    border: 1px solid transparent;\n  }");
    const buttons = layer.slice(layer.indexOf(".button--secondary"));
    // Decision 2: a control carries the fill and a hairline edge, never a backdrop filter.
    expect(buttons).not.toContain("backdrop-filter");
    // HeroUI's focus ring is a box-shadow: the glass buttons must not set one.
    expect(buttons).not.toContain("box-shadow");
    expect(css).toContain(
      "  .button--outline,\n  .close-button--default {\n    border-color: CanvasText;",
    );
  });

  it("draws the radio and the switch round, an off switch edged with a muted thumb, a selected toggle button solid accent, fields with a 1px edge and help text in its own direction", () => {
    expect(layer).toContain(
      "  .radio .radio__control,\n  .radio .radio__indicator,\n  .radio .radio__indicator::before,\n  .switch .switch__control,\n  .switch .switch__thumb {\n    border-radius: var(--radius-full);\n  }",
    );
    expect(layer).toContain(
      '  .switch:not([data-selected="true"], [aria-checked="true"]) .switch__control {\n    outline: var(--field-border-width) solid var(--field-border);\n    outline-offset: calc(-1 * var(--field-border-width));\n  }',
    );
    expect(layer).toContain(
      '  .switch:not([data-selected="true"], [aria-checked="true"]):not([data-disabled="true"]) .switch__thumb {\n    background-color: var(--muted);\n  }',
    );
    expect(layer).not.toContain("--switch-control-bg");
    expect(layer).toContain(
      "  .toggle-button {\n    --toggle-button-bg-selected: var(--accent);\n    --toggle-button-bg-selected-hover: var(--accent-hover);\n    --toggle-button-bg-selected-pressed: var(--accent-hover);\n    --toggle-button-fg-selected: var(--accent-foreground);\n  }",
    );
    expect(blockOf(":root")).toContain("  --field-border-width: 1px;");
    expect(layer).toContain(
      '  [data-slot="description"],\n  [data-slot="field-error"] {\n    unicode-bidi: plaintext;\n  }',
    );
  });

  it("derives the control fill from the thick level, floored at the frosted mode's floor, and makes it static without color-mix", () => {
    for (const block of [
      blockOf(':root,\n[data-theme="light"]'),
      blockOf('.dark,\n[data-theme="dark"]'),
    ])
      expect(block).toContain(
        `  --material-control-fill: color-mix(in oklch, var(--surface) calc(clamp(max(var(--material-fill-floor), ${MATERIAL_MODES.frosted.fillFloor}), var(--material-thick-share) * var(--material-fill-scale), 1) * 100%), transparent);`,
      );
    expect(css).toContain("    --material-control-fill: var(--surface);");
  });
});
