import { colors, fontFamily, motion, radius, shadows, spacing, tokens, typography } from "..";

describe("@stackra/brand", () => {
  it("exports color tokens", () => {
    expect(colors.ink).toBeDefined();
    expect(colors.paper).toBeDefined();
    expect(colors.steel).toBeDefined();
    expect(colors.steelDeep).toBeDefined();
    expect(colors.graphite100).toBeDefined();
    expect(colors.accent).toBeDefined();
    expect(colors.focus).toBeDefined();
    expect(colors.link).toBeDefined();
  });

  it("color tokens have light and dark values", () => {
    const entries = Object.entries(colors) as [
      string,
      { light: string; dark: string; hexLight: string; hexDark: string },
    ][];
    for (const [name, token] of entries) {
      expect(token.light, `${name}.light`).toBeTruthy();
      expect(token.dark, `${name}.dark`).toBeTruthy();
      expect(token.hexLight, `${name}.hexLight`).toMatch(/^#/);
      expect(token.hexDark, `${name}.hexDark`).toMatch(/^#/);
    }
  });

  it("exports typography tokens", () => {
    expect(typography.display).toBeDefined();
    expect(typography.h1).toBeDefined();
    expect(typography.body).toBeDefined();
    expect(typography.mono).toBeDefined();
    expect(typography.bodyAr).toBeDefined();
  });

  it("typography tokens have font and letter-spacing", () => {
    const entries = Object.entries(typography) as [
      string,
      { font: string; letterSpacing: string },
    ][];
    for (const [name, token] of entries) {
      expect(token.font, `${name}.font`).toBeTruthy();
      expect(token.letterSpacing, `${name}.letterSpacing`).toBeDefined();
    }
  });

  it("exports font family stacks", () => {
    expect(fontFamily.sans).toContain("Geist");
    expect(fontFamily.mono).toContain("Geist Mono");
    expect(fontFamily.arabic).toContain("IBM Plex Sans Arabic");
  });

  it("exports spacing tokens", () => {
    expect(spacing["space-1"].value).toBe("4px");
    expect(spacing["space-4"].value).toBe("16px");
    expect(spacing["space-8"].value).toBe("32px");
  });

  it("exports radius tokens", () => {
    expect(radius.radius.value).toBe("0.25rem");
    expect(radius["radius-full"].value).toBe("9999px");
  });

  it("exports shadow tokens", () => {
    expect(shadows.surface.light).toBeTruthy();
    expect(shadows.surface.dark).toBeTruthy();
    expect(shadows.overlay.light).toBeTruthy();
    expect(shadows.overlay.dark).toBeTruthy();
  });

  it("exports motion tokens", () => {
    expect(motion.fast.duration).toBe("150ms");
    expect(motion.base.duration).toBe("250ms");
    expect(motion.blink.duration).toBe("1000ms");
  });

  it("exports a combined tokens object", () => {
    expect(tokens).toBeDefined();
    expect(tokens.colors).toBe(colors);
    expect(tokens.typography).toBe(typography);
    expect(tokens.spacing).toBe(spacing);
    expect(tokens.radius).toBe(radius);
    expect(tokens.shadows).toBe(shadows);
    expect(tokens.motion).toBe(motion);
  });

  it("steel and graphite are achromatic (chroma < 0.02)", () => {
    const steelChroma = Number(colors.steel.light.match(/oklch\([\d.]+ ([\d.]+)/)?.[1]);
    const graphiteChroma = Number(colors.graphite800.light.match(/oklch\([\d.]+ ([\d.]+)/)?.[1]);
    expect(steelChroma).toBeLessThan(0.02);
    expect(graphiteChroma).toBeLessThan(0.02);
  });
});
