/**
 * Stackra file contract:
 * Purpose: `webManifest(kit, theme)`, the web app manifest (`site.webmanifest`): the product's English name and short
 *          name, its icons (192, 512 and the 512 maskable one beside it), the theme colour from the icon tile's role
 *          and the background colour from the splash screen's role, both in the light mode, the display mode and the
 *          start URL.
 * Boundary: pure; answers the object, which the caller writes as JSON. Icon paths are relative to the manifest.
 * Runtime: isomorphic
 * Governing contract: ADR 0441 (decision 5: favicons and the web manifest).
 */
import type { Theme } from "@stackra/tokens/contracts";

import type { BrandKit } from "#contracts/types/brand-kit.type";

/**
 * The manifest of `kit` in `theme`.
 *
 * @example
 * JSON.stringify(webManifest(kit, theme), null, 2);
 */
export function webManifest(kit: BrandKit, theme: Theme) {
  return {
    name: kit.name["en"] ?? kit.id,
    short_name: kit.shortName,
    icons: [
      { src: "icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
    theme_color: theme.colors[kit.icon.background].hexLight,
    background_color: theme.colors[kit.splash.background].hexLight,
    display: kit.manifest.display,
    start_url: kit.manifest.startUrl,
  };
}
