/**
 * Stackra file contract:
 * Purpose: `readPackAssets`, the packs a module ships as `data/` assets (the draft seed packs of this package, or a
 *          product's sections), read through `AssetLibrary` so each file is checked against the hash gen wrote into
 *          the manifest before it is parsed.
 * Boundary: returns the parsed JSON unchecked: a signed pack goes through `verifyPack`, an unsigned draft through
 *           `MarketPack$` in authoring only. Throws `AssetHashMismatchError` and `FileNotFoundError` as
 *           `AssetLibrary.json` does. Uses `@stackra/assets` through its public API only.
 * Runtime: isomorphic
 * Governing contract: ADR 0385 (pack fetch); ADR 0234 (data assets and their hash); ADR 0370 (decision 2).
 */
import type { AssetEntry, AssetLibrary } from "@stackra/assets";

/**
 * The parsed contents of `entries`, in the same order.
 *
 * @example
 * const drafts = (await readPackAssets(library, Object.values(Assets.market_packs.data.packs))).map((raw) =>
 *   MarketPack$.parse(raw),
 * );
 */
export function readPackAssets(
  library: AssetLibrary,
  entries: Iterable<AssetEntry>,
): Promise<unknown[]> {
  return Promise.all(Array.from(entries, (entry) => library.json(entry)));
}
