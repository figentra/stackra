/**
 * Stackra file contract:
 * Purpose: the `Reranker` port: judges how well each of a query's fused candidates answers it and returns them
 *          reordered with scores, so `SearchIndex` can put the best answers first after the hybrid lanes.
 * Boundary: an abstract class that is its own token. `HttpRerankerDriver` (`./node`) speaks the text-embeddings-inference
 *           `/rerank` contract; `MemoryRerankerDriver` (`.`) is the test double. A driver returns every candidate once
 *           at most (`topN` of them, best first) and never an id it was not given. No reranker bound means fused order.
 *           A leaf file: it imports nothing but the `Port` base and its types.
 * Runtime: isomorphic
 * Governing contract: ADR 0492 (decision 4: the reranker); ADR 0221 (decision 1); ADR 0294 (decisions 15 and 16).
 */
import { Port } from "@stackra/contracts";

import type { RerankCandidate } from "#contracts/types/rerank-candidate.type";
import type { RerankHit } from "#contracts/types/rerank-hit.type";

/**
 * Reorders fused search candidates by how well each answers the query.
 *
 * @example
 * const hits = await reranker.rerank("linen shirt", candidates, 20);
 */
export abstract class Reranker extends Port {
  /** How many fused candidates one call takes at most (50 by default, `search.reranker.topN`). */
  abstract readonly topN: number;

  /**
   * The best `topN` of `candidates` for `query`, best first, each with its score.
   *
   * @throws RangeError when `topN` is not a whole number from 1.
   */
  abstract rerank(
    query: string,
    candidates: readonly RerankCandidate[],
    topN: number,
  ): Promise<readonly RerankHit[]>;
}
