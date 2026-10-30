/**
 * Stackra file contract:
 * Purpose: the in-memory `Reranker` for tests and development: scores a candidate by the share of the query's words its
 *          text holds, best first, ties in the order given.
 * Boundary: the memory driver every capability ships first (ADR 0266); isomorphic, so it ships from `.`. It uses the
 *           one normalisation of the index (`searchWordsOf`), so Arabic text and queries compare folded. It judges
 *           word overlap only, never meaning, so it is a stand-in for the model behind `HttpRerankerDriver`.
 * Runtime: isomorphic
 * Governing contract: ADR 0266 (memory drivers first); ADR 0492 (decision 4); ADR 0294 (decision 16).
 */
import { Driver } from "@stackra/container";

import { Reranker } from "#contracts/index";
import type { RerankCandidate, RerankHit } from "#contracts/index";
import { searchWordsOf } from "#core/functions/search-words-of.function";

/**
 * Reranks by word overlap.
 *
 * @example
 * const reranker = new MemoryRerankerDriver();
 * await reranker.rerank("linen shirt", [{ id: "a", text: "wool coat" }, { id: "b", text: "linen shirt" }], 2);
 * // [{ id: "b", score: 1 }, { id: "a", score: 0 }]
 */
export class MemoryRerankerDriver extends Driver(Reranker) {
  /** The most candidates one call takes. */
  readonly topN: number;

  /**
   * @param topN - the most candidates one call takes; 50 when absent.
   */
  constructor(topN = 50) {
    super();
    this.topN = topN;
  }

  /**
   * The best `topN` of `candidates`, best first.
   *
   * @throws RangeError when `topN` is not a whole number from 1.
   */
  async rerank(
    query: string,
    candidates: readonly RerankCandidate[],
    topN: number,
  ): Promise<readonly RerankHit[]> {
    if (!Number.isInteger(topN) || topN < 1)
      throw new RangeError(`topN must be a whole number from 1, got ${topN}`);
    const words = [...new Set(searchWordsOf(query))];
    return (
      candidates
        .map((candidate, at) => {
          const held = new Set(searchWordsOf(candidate.text));
          const score =
            words.length === 0 ? 0 : words.filter((word) => held.has(word)).length / words.length;
          return { id: candidate.id, score, at };
        })
        // oxlint-disable-next-line unicorn/no-array-sort -- sorts an array built here, which nothing else holds; toSorted is ES2023 and the base lib is ES2022
        .sort((a, b) => b.score - a.score || a.at - b.at)
        .slice(0, topN)
        .map(({ id, score }) => ({ id, score }))
    );
  }
}
