/**
 * Stackra file contract:
 * Purpose: unit tests of `webManifest`: the names come from the kit, the colours from the roles it names in the
 *          theme, and the icons sit beside the manifest.
 * Boundary: test only; pure.
 * Runtime: node (vitest)
 * Governing contract: ADR 0022 (test placement); ADR 0441 (decision 5).
 */
import { describe, expect, it } from "@stackra/testing";
import { STACKRA_THEME } from "@stackra/tokens";

import { webManifest } from "#core/functions/web-manifest.function";
import { KIT } from "#core/functions/__tests__/fixtures/kit.fixture";

describe("webManifest", () => {
  it("names the product and takes its colours from the theme", () => {
    const manifest = webManifest(KIT, STACKRA_THEME);
    expect(manifest.name).toBe("Acme");
    expect(manifest.short_name).toBe("Acme");
    expect(manifest.theme_color).toBe(STACKRA_THEME.colors.accent.hexLight);
    expect(manifest.background_color).toBe(STACKRA_THEME.colors.background.hexLight);
    expect(manifest.icons.map((icon) => icon.src)).toEqual([
      "icon-192.png",
      "icon-512.png",
      "icon-maskable-512.png",
    ]);
  });
});
