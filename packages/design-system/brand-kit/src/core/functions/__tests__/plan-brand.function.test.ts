/**
 * Stackra file contract:
 * Purpose: unit tests of `planBrand`: it plans the whole generated set with the paths Runway and the templates read,
 *          renders the CSS with @stackra/tokens, colours the icons from the roles the kit names, keeps the platforms'
 *          safe zones, and plans the same outputs twice for the same input.
 * Boundary: test only; pure, nothing is rasterised.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0441 (decision 5).
 */
import { describe, expect, it } from "@stackra/testing";
import { renderWebCss, STACKRA_THEME } from "@stackra/tokens";

import { planBrand } from "#core/functions/plan-brand.function";
import { KIT, SYMBOL_SVG } from "#core/functions/__tests__/fixtures/kit.fixture";

describe("planBrand", () => {
  const outputs = planBrand(KIT, STACKRA_THEME, SYMBOL_SVG);
  const byPath = new Map(outputs.map((output) => [output.path, output]));

  it("plans the whole set", () => {
    expect([...byPath.keys()].sort()).toEqual([
      "android/adaptive-background.png",
      "android/adaptive-foreground.png",
      "android/adaptive-monochrome.png",
      "favicon/apple-touch-icon.png",
      "favicon/favicon.ico",
      "favicon/favicon.svg",
      "favicon/icon-192.png",
      "favicon/icon-512.png",
      "favicon/icon-maskable-512.png",
      "favicon/site.webmanifest",
      "heroui/native.css",
      "heroui/web.css",
      "icons/app-icon-1024.png",
      "splash/splash-icon.dark.png",
      "splash/splash-icon.light.png",
      "splash/splash.json",
      "tokens/theme.json",
      "tokens/tokens.dtcg.json",
    ]);
  });

  it("renders the web CSS with @stackra/tokens", () => {
    expect(byPath.get("heroui/web.css")).toEqual({
      kind: "text",
      path: "heroui/web.css",
      text: renderWebCss(STACKRA_THEME),
    });
  });

  it("colours the app icon from the kit's roles", () => {
    const icon = byPath.get("icons/app-icon-1024.png");
    expect(icon?.kind === "png" && icon.svg).toContain(
      `fill="${STACKRA_THEME.colors.accent.hexLight}"`,
    );
    expect(icon?.kind === "png" && icon.svg).toContain(
      `color="${STACKRA_THEME.colors["accent-foreground"].hexLight}"`,
    );
  });

  it("keeps the adaptive icon inside the visible 72 of 108 dp", () => {
    const layer = byPath.get("android/adaptive-foreground.png");
    const side = 1024 * (KIT.icon.scale * (72 / 108));
    expect(layer?.kind === "png" && layer.svg).toContain(`width="${side}"`);
  });

  it("splashes in both modes", () => {
    const splash = byPath.get("splash/splash.json");
    expect(JSON.parse(splash?.kind === "text" ? splash.text : "{}")).toEqual({
      light: {
        image: "splash-icon.light.png",
        backgroundColor: STACKRA_THEME.colors.background.hexLight,
      },
      dark: {
        image: "splash-icon.dark.png",
        backgroundColor: STACKRA_THEME.colors.background.hexDark,
      },
    });
  });

  it("is deterministic", () => {
    expect(planBrand(KIT, STACKRA_THEME, SYMBOL_SVG)).toEqual(outputs);
  });
});
