/**
 * Stackra file contract:
 * Purpose: `ResolvedAsset`, what `AssetLibrary.resolve` and `useAsset` return: the key, the source file and the URL
 *          the configured disk serves the published file from.
 * Boundary: type only; a plain object, built per call.
 * Runtime: isomorphic
 * Governing contract: ADR 0234 (decisions 3 and 7).
 */
import type { AssetKey } from "#core/types/asset-key.type";

/**
 * A public asset with its URL.
 *
 * @example
 * <img src={logo.url} alt="" />
 */
export type ResolvedAsset<K extends AssetKey = AssetKey> = {
  /** The asset key. */
  readonly key: K;
  /** The source file relative to the member root. */
  readonly file: string;
  /** The URL of the published file. */
  readonly url: string;
};
