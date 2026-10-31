/**
 * Stackra file contract:
 * Purpose: proves the glass system's stylesheet (ADR 0320 as amended 2026-10-31): the family role maps (front glass on
 *          chrome and surfaces, studio glass only on what floats), the theme's own family on `:root`, a role override,
 *          the level and role classes, HeroUI's overlays drawn in their roles only outside the solid mode for a solid
 *          theme, the scrolled nav bar, the accessibility fallbacks and the clear-glass dim floors in the colour
 *          blocks; and `materialRoleLevel`, which native reads too.
 * Boundary: strings in memory.
 * Runtime: node
 * Governing contract: ADR 0320; ADR 0501 (tokens v2, the materials block); ADR 0022 (test placement).
 */
import { MaterialRole } from "#contracts/enums/material-role.enum";
import { MATERIAL_FAMILY_ROLES } from "#core/constants/material-family-roles.constant";
import { STACKRA_THEME } from "#core/constants/stackra-theme.constant";
import { InvalidThemeError } from "#core/errors/invalid-theme.error";
import { defineTheme } from "#core/functions/define-theme.function";
import { materialRoleLevel } from "#core/functions/material-role-level.function";
import { renderMaterialCss } from "#core/functions/render-material-css.function";
import { renderWebCss } from "#core/functions/render-web-css.function";

const { blocks, components, fallbacks } = renderMaterialCss(STACKRA_THEME);
/** The problems `defineTheme` reports for `theme`, joined. */
const problemsOf = (theme: unknown): string => {
  try {
    defineTheme(theme as typeof STACKRA_THEME);
  } catch (error) {
    if (error instanceof InvalidThemeError) return error.problems.join("\n");
    throw error;
  }
  return "";
};
const blockOf = (start: string) => blocks.find((block) => block.startsWith(start)) ?? "";

describe("renderMaterialCss", () => {
  it("puts the theme's family on :root and maps front chrome to glass, studio content to solid", () => {
    expect(STACKRA_THEME.materials.family).toBe("studio");
    const studio = blockOf(":root {");
    const front = blockOf('[data-family="front"]');
    // An asked-for family follows the default, so it wins at the same specificity.
    expect(blocks.map((block) => block.split(" {")[0])).toEqual([
      ":root",
      '[data-family="front"]',
      '[data-family="studio"]',
    ]);
    expect(studio).toContain("  --material-role-sidebar-fill: var(--surface);");
    // Popovers hold muted text, so their glass takes the thick fill (ADR 0320 decision 4).
    expect(studio).toContain("  --material-role-popover-fill: var(--material-thick-fill);");
    expect(studio).toContain("  --material-role-popover-filter: var(--material-glass-filter);");
    expect(studio).toContain("  --material-role-toast-fill: var(--material-glass-fill);");
    expect(studio).toContain("  --material-role-nav-bar-filter: none;");
    // A studio header turns glass once content scrolls under it.
    expect(studio).toContain(
      "  --material-role-nav-bar-scrolled-fill: var(--material-glass-fill);",
    );
    expect(front).toContain("  --material-role-sidebar-fill: var(--material-glass-fill);");
    expect(front).toContain("  --material-role-nav-bar-filter: var(--material-glass-filter);");
    expect(front).toContain(
      "  --material-role-media-controls-label-fill: var(--material-glass-clear-label-fill);",
    );
    // Studio never puts content on glass.
    for (const role of ["card", "sidebar", "toolbar"] as const)
      expect(MATERIAL_FAMILY_ROLES.studio[role]).toBe("solid");
  });

  it("writes one drawing class per level and role, and the press lift on glass", () => {
    const layer = components.join("\n");
    for (const role of MaterialRole) expect(layer).toContain(`  .material-role-${role} {`);
    for (const level of ["ultra-thin", "glass", "glass-clear", "glass-clear-label"])
      expect(layer).toContain(`  .material-${level} {`);
    expect(layer).toContain("    backdrop-filter: var(--material-role-toast-filter);");
    expect(layer).toContain("    background-color: var(--material-glass-clear-label-fill);");
    expect(layer).toContain("    scale: 1.02;");
  });

  it("draws HeroUI's overlays in their roles only where glass is asked for, for a solid-default theme", () => {
    const layer = components.join("\n");
    expect(layer).toContain(
      '  :root:is([data-material="frosted"], [data-material="glass"], [data-material="liquid"]) .popover {',
    );
    const asWritten = renderMaterialCss({
      ...STACKRA_THEME,
      materials: { ...STACKRA_THEME.materials, defaultMode: "glass" },
    });
    expect(asWritten.components.join("\n")).toContain(
      '  :root:not([data-material="solid"]) .dropdown__popover {',
    );
  });

  it("drops the rim under reduced transparency, the tint under more contrast, and keeps an edge in forced colours", () => {
    expect(fallbacks).toContain(
      "@media (prefers-reduced-transparency: reduce) {\n  :root,\n  [data-material] {\n    --material-rim-scale: 0;",
    );
    expect(fallbacks).toContain("    --material-tint-scale: 0;\n    --material-edge-floor: 0.45;");
    expect(fallbacks).toContain("    --material-clear-floor: 0.7;");
    expect(fallbacks).toContain("    --material-glass-clear-dim: 0.5;");
    const forced = fallbacks.slice(fallbacks.indexOf("@media (forced-colors: active)"));
    expect(forced).toContain("  .material-role-toast,");
    expect(forced).toContain("    border: 1px solid CanvasText;");
  });

  it("applies the same fallbacks when the provider forces data-transparency or data-contrast", () => {
    expect(fallbacks).toContain(
      'html[data-transparency="reduce"],\nhtml[data-transparency="reduce"] [data-material] {\n  --material-rim-scale: 0;\n}',
    );
    expect(fallbacks).toContain(
      'html[data-contrast="more"] [data-material] {\n  --material-tint-scale: 0;\n  --material-edge-floor: 0.45;\n  --material-edge-share: 0.45;\n}',
    );
    expect(fallbacks).toContain(
      'html[data-contrast="more"]:not([data-transparency="reduce"]) [data-material] {\n  --material-clear-floor: 0.7;\n}',
    );
  });

  it("never draws clear glass below the dim floors", () => {
    const css = renderWebCss(STACKRA_THEME);
    expect(css).toContain(
      "  --material-glass-clear-fill: color-mix(in oklch, oklch(0 0 0) calc(clamp(max(0.5, var(--material-clear-floor)), var(--material-glass-clear-dim), 1) * 100%), transparent);",
    );
    expect(css).toContain("clamp(max(0.55, var(--material-clear-floor))");
    expect(css).toContain("  --floating-shadow: 0px 8px 24px -6px");
    expect(css).toContain("  --icon-stroke-500: 1.75;");
  });

  it("lets a theme move a role, and refuses a role or level it does not know", () => {
    const moved = { ...STACKRA_THEME.materials, roles: { studio: { sidebar: "glass" as const } } };
    expect(materialRoleLevel(moved, "studio", "sidebar")).toBe("glass");
    expect(materialRoleLevel(moved, "studio", "card")).toBe("solid");
    expect(materialRoleLevel(undefined, "front", "fab")).toBe("glass");
    expect(renderMaterialCss({ ...STACKRA_THEME, materials: moved }).blocks[2]).toContain(
      "  --material-role-sidebar-fill: var(--material-glass-fill);",
    );
    expect(
      problemsOf({
        ...STACKRA_THEME,
        materials: {
          ...STACKRA_THEME.materials,
          family: "kiosk",
          defaultMode: "matte",
          roles: { studio: { banner: "glass" }, other: {} },
        },
      }),
    ).toMatch(
      /materials\.family[\s\S]*materials\.defaultMode[\s\S]*studio\.banner[\s\S]*roles\.other/,
    );
  });

  it("refuses wild level fields and icon strokes", () => {
    const { glass } = STACKRA_THEME.materials.levels;
    expect(
      problemsOf({
        ...STACKRA_THEME,
        materials: {
          ...STACKRA_THEME.materials,
          levels: {
            ...STACKRA_THEME.materials.levels,
            glass: {
              ...glass,
              tintSource: "paper",
              tint: 0.5,
              brightness: 3,
              edge: { light: 2, dark: 0 },
              rim: { light: 0 },
              specular: -1,
              innerDepth: { y: "1rem", blur: "2px", alpha: { light: 0, dark: 0 } },
              elevation: "sky",
              dim: 2,
              vibrancy: ["shout"],
            },
          },
        },
        iconStroke: { bold: 2 },
      }),
    ).toMatch(
      /tintSource[\s\S]*tint is[\s\S]*brightness[\s\S]*edge[\s\S]*rim[\s\S]*specular[\s\S]*innerDepth[\s\S]*elevation[\s\S]*dim[\s\S]*vibrancy/,
    );
    expect(problemsOf({ ...STACKRA_THEME, iconStroke: { bold: 2 } })).toMatch(/iconStroke\.bold/);
    expect(problemsOf(STACKRA_THEME)).toBe("");
  });
});
