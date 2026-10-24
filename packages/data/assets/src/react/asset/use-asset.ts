/**
 * Stackra file contract:
 * Purpose: `useAsset(entry)`, the hook a component reads a public asset's URL with
 *          (`useAsset(Assets.console.public.logo_svg).url`), through the `AssetLibrary` of the nearest container.
 * Boundary: resolves per render (pure string work, no I/O). Throws outside a `ContainerProvider`, when the container
 *           does not bind `AssetLibrary` (or the `FileSystem` it takes), or for a non-public asset, so a missing asset
 *           context is never a silent broken image.
 * Runtime: isomorphic
 * Governing contract: ADR 0234 (decision 3: `useAsset`); ADR 0294 (decision 17); ADR 0295 (decision 10).
 */
import { useContainer } from "@stackra/container/react";

import { AssetLibrary } from "#core/index";
import type { AssetEntry, AssetKey, ResolvedAsset } from "#core/index";

/**
 * The key, source file and URL of a public asset.
 *
 * @throws Error outside a `ContainerProvider`, or when the container does not bind `AssetLibrary`.
 * @throws TypeError when the asset is not in the `public/` kind folder.
 * @example
 * const logo = useAsset(Assets.console.public.logo_svg);
 * return <img src={logo.url} alt="" />;
 */
export function useAsset<K extends AssetKey>(entry: AssetEntry<K>): ResolvedAsset<K> {
  return useContainer().get(AssetLibrary).resolve(entry);
}
