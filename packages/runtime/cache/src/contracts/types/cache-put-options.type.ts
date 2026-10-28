/**
 * Stackra file contract:
 * Purpose: `CachePutOptions`, what a `put` (and a `remember`) may add to an entry: the tags `forgetTag` drops it by.
 * Boundary: a type only, plain data. A tag is a `CacheKey`, so it is named after its owner like any key
 *           (`CacheKey.of(Category, id)`); tags match exactly, a tag does not cover the tags that extend it. Tags live
 *           in the same namespace as the entry, so a `forgetTag` in one namespace never reaches another.
 * Runtime: isomorphic
 * Governing contract: ADR 0150 (decision 2: tags); ADR 0305 (rule 32).
 */
import type { CacheKey } from "#contracts/types/cache-key.type";

/**
 * Options of `Cache.put`.
 *
 * @example
 * await cache.put(CacheKey.of(Product, id), view, Duration.minutes(10), { tags: [CacheKey.of(Category, view.categoryId)] });
 * await cache.forgetTag(CacheKey.of(Category, categoryId)); // every product view of the category
 */
export interface CachePutOptions {
  /** The tags the entry is dropped by, besides its own key and the keys that cover it. */
  readonly tags?: readonly CacheKey[];
}
