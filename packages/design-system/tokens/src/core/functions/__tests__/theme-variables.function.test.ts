/**
 * Stackra file contract:
 * Purpose: proves themeVariables splits a theme's web custom properties by owner (HeroUI's colour roles, shadows and
 *          radii; Stackra's palette, fonts, type, spacing, steps, motion and material) for both modes, that renderWebCss
 *          writes every one of them, and that materialModeVariables gives each mode's factors.
 * Boundary: in-memory themes only.
 * Runtime: node
 * Governing contract: ADR 0302; ADR 0320; ADR 0022 (test placement).
 */
import { ColorRole } from "#contracts/enums/color-role.enum";
import { MATERIAL_MODES } from "#core/constants/material-modes.constant";
import { STACKRA_THEME } from "#core/constants/stackra-theme.constant";
import { materialModeVariables } from "#core/functions/material-mode-variables.function";
import { renderWebCss } from "#core/functions/render-web-css.function";
import { themeVariables } from "#core/functions/theme-variables.function";

const { heroui, stackra } = themeVariables(STACKRA_THEME);

describe("themeVariables", () => {
  it("gives HeroUI its colour roles and shadows per mode and its two radii", () => {
    for (const role of ColorRole) {
      expect(heroui.light[`--${role}`]).toBe(STACKRA_THEME.colors[role].light);
      expect(heroui.dark[`--${role}`]).toBe(STACKRA_THEME.colors[role].dark);
    }
    expect(heroui.dark["--overlay-shadow"]).toBe(STACKRA_THEME.shadows.overlay.dark);
    expect(heroui.root).toEqual({ "--radius": "0.25rem", "--field-radius": "var(--radius)" });
  });

  it("gives Stackra its additions, none of HeroUI's", () => {
    expect(stackra.light["--amber"]).toBe(STACKRA_THEME.palette.amber?.light);
    expect(stackra.root["--font-arabic"]).toBe(STACKRA_THEME.fontFamily.arabic);
    expect(stackra.root["--space-4"]).toBe(STACKRA_THEME.spacing["4"]);
    expect(stackra.root["--material-regular-blur"]).toBe("20px");
    expect(stackra.dark["--material-thick-share"]).toBe("0.92");
    for (const name of Object.keys(heroui.light)) expect(stackra.light[name]).toBeUndefined();
  });

  it("is what renderWebCss writes", () => {
    const css = renderWebCss(STACKRA_THEME);
    for (const set of [heroui, stackra])
      for (const [name, value] of Object.entries({ ...set.root, ...set.light }))
        expect(css).toContain(`  ${name}: ${value};`);
  });

  it("writes each material mode's factors", () => {
    expect(materialModeVariables("liquid")).toEqual({
      "--material-fill-scale": String(MATERIAL_MODES.liquid.fillScale),
      "--material-fill-floor": "0",
      "--material-blur-scale": String(MATERIAL_MODES.liquid.blurScale),
      "--material-saturate-scale": String(MATERIAL_MODES.liquid.saturationScale),
      "--material-brightness": String(MATERIAL_MODES.liquid.brightness),
      "--material-sheen": String(MATERIAL_MODES.liquid.sheen),
    });
  });
});
