/**
 * Stackra file contract:
 * Purpose: `CacheKey`, the only maker of a cache key: `CacheKey.of(Model, ...parts)`, plus the key type of the same
 *          name.
 * Boundary: a frozen namespace object and the brand type re-stated from `#contracts/types/cache-key.type`. A key is
 *           the model's class name, then each part URI-encoded, joined by `:`, so `:` only ever separates parts and a
 *           shorter key covers exactly the keys that extend it part by part. No namespace here: the driver adds it.
 * Runtime: isomorphic
 * Governing contract: ADR 0305 (rule 32: `CacheKey.of(Model, ...)`); ADR 0150 (decision 2).
 */
import type { CacheKey as Key } from "#contracts/types/cache-key.type";

/** A cache key, made only by `CacheKey.of`. */
export type CacheKey = Key;

/** What a key is named after: a model class (`Product`), or any named class that owns the cached value. */
type KeyOwner = abstract new (...args: never) => unknown;

/**
 * Builds cache keys.
 *
 * @example
 * CacheKey.of(Product, id, locale); // "Product:prd_01J…:en"
 * cache.forget(CacheKey.of(Product, id)); // covers the view in every locale
 */
export const CacheKey = Object.freeze({
  /**
   * The key of `owner` and `parts`, in order. Fewer parts cover more keys.
   *
   * shortcut: the owner's class name is the prefix, so a minifier that renames classes would change keys; switch to
   * the gen-derived model identity when the manifest is readable at runtime.
   * @throws RangeError when `owner` has no name (an anonymous class).
   */
  of(owner: KeyOwner, ...parts: readonly (string | number)[]): CacheKey {
    if (owner.name === "")
      throw new RangeError("A cache key needs a named class, not an anonymous one");
    return [owner.name, ...parts.map((part) => encodeURIComponent(String(part)))].join(
      ":",
    ) as CacheKey;
  },
});
