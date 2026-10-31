/**
 * Stackra file contract:
 * Purpose: proves native reads the web's values (ADR 0501): `nativeTokens` gives the Stackra theme's control heights,
 *          type steps, layers and radius roles as px numbers, follows the density knob, keeps the 44pt touch floor and
 *          lets a theme's `radius.steps` override a role; `lengthPx` reads px, rem, spacing multiples and the radius
 *          variables, and nothing else.
 * Boundary: pure calls on in-memory themes.
 * Runtime: node
 * Governing contract: ADR 0501; ADR 0022 (test placement).
 */
import type { Theme } from "#contracts/types/theme.type";
import { STACKRA_THEME } from "#core/constants/stackra-theme.constant";
import { lengthPx } from "#core/functions/length-px.function";
import { nativeTokens } from "#core/functions/native-tokens.function";

describe("lengthPx", () => {
  it("reads px, rem, unitless numbers, spacing multiples and the radius variables", () => {
    expect(lengthPx(STACKRA_THEME, "12px")).toBe(12);
    expect(lengthPx(STACKRA_THEME, "0.75rem")).toBe(12);
    expect(lengthPx(STACKRA_THEME, "1.5")).toBe(1.5);
    expect(lengthPx(STACKRA_THEME, "calc(var(--spacing) * 9)")).toBe(36);
    expect(lengthPx(STACKRA_THEME, "var(--field-radius)")).toBe(4);
    expect(lengthPx(STACKRA_THEME, "var(--radius-pill)")).toBe(9999);
  });

  it("gives undefined for a length with no px form", () => {
    expect(lengthPx(STACKRA_THEME, "50%")).toBeUndefined();
    expect(lengthPx(STACKRA_THEME, "var(--other)")).toBeUndefined();
  });
});

describe("nativeTokens", () => {
  const tokens = nativeTokens(STACKRA_THEME);

  it("gives the Stackra control heights, type steps and layers as numbers", () => {
    expect(tokens.spacing).toBe(4);
    expect(tokens.controlHeight).toEqual({ sm: 32, md: 36, lg: 40 });
    expect(tokens.typeScale["3xs"]).toEqual({ fontSize: 10, lineHeight: 14 });
    expect(tokens.zIndex["overlay"]).toBe(50);
    expect(tokens.opacity["disabled"]).toBe(0.5);
    expect(tokens.borderCurve).toBe("circular");
  });

  it("keeps the 44pt native touch floor over the web's 24px", () => {
    expect(tokens.touchTarget).toBe(44);
  });

  it("computes the radius roles as the web does, with the 2px inner floor", () => {
    expect(tokens.radius).toMatchObject({
      control: 4,
      "control-inner": 2,
      container: 8,
      "container-inner": 4,
      pill: 9999,
      button: 4,
      card: 8,
    });
  });

  it("follows the density knob and a theme's role override", () => {
    const compact: Theme = {
      ...STACKRA_THEME,
      layout: { ...STACKRA_THEME.layout, spacing: "0.225rem" },
      radius: {
        ...STACKRA_THEME.radius,
        steps: { ...STACKRA_THEME.radius.steps, control: "var(--radius-pill)" },
      },
    };
    const values = nativeTokens(compact);
    expect(values.controlHeight["md"]).toBeCloseTo(32.4);
    expect(values.radius["control"]).toBe(9999);
    expect(values.radius["button"]).toBe(9999);
  });

  it("hands native the family, both role maps, the dim floors, and the icon strokes", () => {
    const { materials, iconStroke } = nativeTokens(STACKRA_THEME);
    expect(materials.family).toBe("studio");
    expect(materials.defaultMode).toBe("solid");
    expect(materials.roles.front["tab-bar"]).toBe("glass");
    expect(materials.roles.studio.sidebar).toBe("solid");
    expect(materials.dim).toEqual({ theme: 0.35, glyph: 0.5, label: 0.55 });
    expect(iconStroke["500"]).toBe(1.75);
  });
});
