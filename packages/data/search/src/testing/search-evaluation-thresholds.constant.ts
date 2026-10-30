/**
 * Stackra file contract:
 * Purpose: `SEARCH_EVALUATION_THRESHOLDS`, the lowest mean NDCG@10 and recall@50 a search change may leave the evaluation set
 *          with.
 * Boundary: data only, in the `./testing` entry. Raise them with the change that earns it, never lower them to make a change pass.
 * Runtime: isomorphic
 * Governing contract: ADR 0492 (decision 5 and enforcement: a fixed evaluation set of Arabic, English and mixed queries).
 */

/** The lowest scores a search change may leave the set with. */
export const SEARCH_EVALUATION_THRESHOLDS = {
  /** The lowest mean NDCG@10 over the judged queries. */
  ndcgAt10: 0.85,
  /** The lowest mean recall@50 over the judged queries. */
  recallAt50: 0.95,
} as const;
