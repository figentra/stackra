/**
 * Stackra file contract:
 * Purpose: `MemoryRecommenderSeed`, the answers a `MemoryRecommenderDriver` holds, by item id and kind.
 * Boundary: a type only.
 * Runtime: isomorphic
 * Governing contract: ADR 0266 (memory drivers first); ADR 0492 (decision 8).
 */
import type { Recommendation } from "#contracts/index";

/** The answers a memory recommender holds. */
export interface MemoryRecommenderSeed {
  /** The similar items of each item. */
  readonly similar?: Readonly<Record<string, readonly Recommendation[]>>;

  /** The items bought together with each item. */
  readonly boughtTogether?: Readonly<Record<string, readonly Recommendation[]>>;
}
