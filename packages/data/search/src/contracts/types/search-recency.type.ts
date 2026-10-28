/**
 * Stackra file contract:
 * Purpose: `SearchRecency`, the ranking rule that decays a match's relevance with the age of a date field.
 * Boundary: a type only, read from the `search.rules` setting. A match's relevance is halved every `halfLifeDays`
 *           after its first stored ISO date of the path; a match without one keeps its relevance.
 * Runtime: isomorphic
 * Governing contract: ADR 0221 (decision 1); ADR 0307 (rules 22 to 24); data-layer gap se11 (stackra-326).
 */

/** The recency rule. */
export interface SearchRecency {
  /** The date path (ISO 8601 values) whose age decays relevance. */
  readonly path: string;

  /** The days after which relevance is halved, above 0. */
  readonly halfLifeDays: number;
}
