/**
 * Stackra file contract:
 * Purpose: the in-memory `Recommender` for tests and development: answers held per item and kind, seeded by the test.
 * Boundary: the memory driver every capability ships first (ADR 0266); isomorphic, so it ships from `.`. It computes
 *           nothing: an item with no seeded answer has none, the item itself is never in its own answer, and an answer
 *           is cut at `limit` (10 when absent), best score first.
 * Runtime: isomorphic
 * Governing contract: ADR 0266 (memory drivers first); ADR 0492 (decision 8); ADR 0294 (decision 16).
 */
import { Driver } from "@stackra/container";

import { Recommender } from "#contracts/index";
import type { RecommendOptions, Recommendation } from "#contracts/index";
import type { MemoryRecommenderSeed } from "#core/types/memory-recommender-seed.type";

/** Items per answer when the call names no limit. */
const DEFAULT_LIMIT = 10;

/**
 * Answers from what it was given.
 *
 * @example
 * const recommender = new MemoryRecommenderDriver({ similar: { prd_1: [{ id: "prd_2", score: 0.9 }] } });
 * await recommender.similar("prd_1"); // [{ id: "prd_2", score: 0.9 }]
 */
export class MemoryRecommenderDriver extends Driver(Recommender) {
  /** The seeded answers. */
  private readonly seed: MemoryRecommenderSeed;

  /**
   * @param seed - the answers per item; none when absent.
   */
  constructor(seed: MemoryRecommenderSeed = {}) {
    super();
    this.seed = seed;
  }

  /** The seeded similar items of `itemId`. */
  async similar(
    itemId: string,
    options: RecommendOptions = {},
  ): Promise<readonly Recommendation[]> {
    return this.answer(this.seed.similar, itemId, options);
  }

  /** The seeded bought-together items of `itemId`. */
  async boughtTogether(
    itemId: string,
    options: RecommendOptions = {},
  ): Promise<readonly Recommendation[]> {
    return this.answer(this.seed.boughtTogether, itemId, options);
  }

  /**
   * The best `limit` of `answers[itemId]`, without the item itself.
   *
   * @throws RangeError when the limit is not a whole number from 1.
   */
  private answer(
    answers: Readonly<Record<string, readonly Recommendation[]>> | undefined,
    itemId: string,
    options: RecommendOptions,
  ): readonly Recommendation[] {
    const limit = options.limit ?? DEFAULT_LIMIT;
    if (!Number.isInteger(limit) || limit < 1)
      throw new RangeError(`A recommendation limit is a whole number from 1, got ${limit}`);
    return (
      (answers?.[itemId] ?? [])
        .filter((item) => item.id !== itemId)
        // oxlint-disable-next-line unicorn/no-array-sort -- sorts an array built here, which nothing else holds; toSorted is ES2023 and the base lib is ES2022
        .sort((a, b) => b.score - a.score)
        .slice(0, limit)
    );
  }
}
