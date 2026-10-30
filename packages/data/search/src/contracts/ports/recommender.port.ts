/**
 * Stackra file contract:
 * Purpose: the `Recommender` port: the items similar to an item, and the items bought together with it.
 * Boundary: an abstract class that is its own token. It deals in item ids only and knows no domain:
 *           `PostgresRecommenderDriver` (`./node`) answers from the vector index and a co-occurrence table the host
 *           names, `HttpRecommenderDriver` (`./node`) calls the `tools-recommend` image, `MemoryRecommenderDriver` (`.`)
 *           is the test double. An answer is best first, never holds the item itself, and is empty for an item it knows
 *           nothing about. A leaf file.
 * Runtime: isomorphic
 * Governing contract: ADR 0492 (decision 8: recommendations answer from Postgres first, an image replaces it per
 *                     tenant behind this port); ADR 0294 (decisions 15 and 16).
 */
import { Port } from "@stackra/contracts";

import type { RecommendOptions } from "#contracts/types/recommend-options.type";
import type { Recommendation } from "#contracts/types/recommendation.type";

/**
 * A recommender.
 *
 * @example
 * const similar = await recommender.similar(product.id, { limit: 8 });
 */
export abstract class Recommender extends Port {
  /**
   * The items closest in meaning to `itemId`, best first.
   *
   * @throws RangeError when `options.limit` is not a whole number from 1.
   */
  abstract similar(itemId: string, options?: RecommendOptions): Promise<readonly Recommendation[]>;

  /**
   * The items most often bought together with `itemId`, best first.
   *
   * @throws RangeError when `options.limit` is not a whole number from 1.
   */
  abstract boughtTogether(
    itemId: string,
    options?: RecommendOptions,
  ): Promise<readonly Recommendation[]>;
}
