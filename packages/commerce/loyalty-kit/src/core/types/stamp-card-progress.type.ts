/**
 * Stackra file contract:
 * Purpose: `StampCardProgress`, where a member stands on a stamp card: stamps on the current card, how many it holds,
 *          and how many full cards (rewards) the balance covers.
 * Boundary: a type only; the result of `stampCardProgress`.
 * Runtime: isomorphic
 * Governing contract: the PUT-133 answer (stamp cards); ADR 0294 (decision 8).
 */

/** Stamp card progress. */
export interface StampCardProgress {
  /** Stamps on the card being filled. */
  readonly stamps: number;

  /** Stamps one card holds. */
  readonly perCard: number;

  /** Full cards the balance covers, each one reward to redeem. */
  readonly fullCards: number;
}
