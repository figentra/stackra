/**
 * Stackra file contract:
 * Purpose: `useBrandLogo(logo, mode)`, the URL a `BrandLogo` draws, web and native: the host's `logo` for the scheme on
 *          screen, else the theme's own (`ThemingConfig.logo`) through the container's `AssetLibrary`, else `null`.
 * Boundary: internal to the BrandLogo blocks; not an entry export. The scheme on screen is `mode`, else
 *           `useColorScheme().resolved`. The theme holds one logo for both schemes. A container that binds no
 *           `ThemingConfig` has no theme logo; one whose theme has a logo but binds no `AssetLibrary` throws, so a
 *           missing asset context is never a silent broken image (as `useAsset`).
 * Runtime: isomorphic
 * Governing contract: ADR 0234 (decision 3: public asset URLs); ADR 0060 (light and dark); ADR 0294 (decision 17).
 */
import { AssetLibrary } from "@stackra/assets";
import type { AssetKey } from "@stackra/assets";
import { useContainer } from "@stackra/container/react";
import type { ResolvedColorScheme } from "@stackra/ui/contracts";

import { ThemingConfig } from "#core/index";
import type { BrandLogoSource } from "#core/types/brand-logo-source.type";
import { useColorScheme } from "#react/color-scheme/use-color-scheme";

/**
 * The logo URL to draw, or `null` for the fallback.
 *
 * @throws Error outside a `ContainerProvider`, when the container does not bind `ColorSchemeService`, or when the
 *         theme has a logo and the container does not bind `AssetLibrary`.
 */
export function useBrandLogo(
  logo: BrandLogoSource | undefined,
  mode: ResolvedColorScheme | undefined,
): string | null {
  const { resolved } = useColorScheme();
  const container = useContainer();
  if (logo !== undefined) return logo[mode ?? resolved];
  const source = container.has(ThemingConfig) ? container.get(ThemingConfig).logo : null;
  if (source === null) return null;
  // The library addresses an asset by its key alone, so a bare key from the config needs no generated entry.
  const entry =
    typeof source === "string"
      ? { key: source as AssetKey, file: source, overridable: false }
      : source;
  return container.get(AssetLibrary).resolve(entry).url;
}
