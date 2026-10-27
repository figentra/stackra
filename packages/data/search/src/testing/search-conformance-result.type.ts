/**
 * Stackra file contract:
 * Purpose: `SearchConformanceResult`, what one case of the `SearchDriver` conformance suite answers: its id and every
 *          port rule the driver missed.
 * Boundary: a type only, in the `./testing` entry. An empty `mismatches` is a pass; the suite never throws for a miss,
 *           so one run reports every case.
 * Runtime: isomorphic
 * Governing contract: ADR 0089 (decision 5: drivers pass the port's conformance suite); ADR 0269.
 */

/** One case's outcome. */
export interface SearchConformanceResult {
  /** The case id (`search.filters`). */
  readonly caseId: string;

  /** Each rule the driver missed, in words; empty when it passed. */
  readonly mismatches: readonly string[];
}
