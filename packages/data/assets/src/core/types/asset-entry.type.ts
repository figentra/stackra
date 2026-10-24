/**
 * Stackra file contract:
 * Purpose: `AssetEntry`, one leaf of the generated `#stackra/assets` tree: the asset's key, the member-relative file gen
 *          collected it from, and whether a host may shadow it under `src/overrides/<owner>/`.
 * Boundary: data written by gen; `file` already names the file that won when a host shadows the asset (ADR 0306
 *           rule 2), so nothing at runtime looks at the overrides tree. The runtime addresses an asset by `key` only.
 * Runtime: isomorphic
 * Governing contract: ADR 0234 (decisions 4, 5 and 9 as amended); ADR 0306 (rules 1, 2 and 11).
 */
import type { AssetKey } from "#core/types/asset-key.type";

/**
 * One shipped asset.
 *
 * @example
 * const logo: AssetEntry<"console::public/logo.svg"> = {
 *   key: "console::public/logo.svg",
 *   file: "assets/public/logo.svg",
 *   overridable: true,
 * };
 */
export type AssetEntry<K extends AssetKey = AssetKey> = {
  /** `<module>::<kind>/<path>`, locked in the owner's `stackra.manifest.json`. */
  readonly key: K;
  /** The source file relative to the member root (`assets/public/orders/logo.svg`). */
  readonly file: string;
  /** Whether a host may replace the file with a shadow at the same path in its overrides tree. */
  readonly overridable: boolean;
};
