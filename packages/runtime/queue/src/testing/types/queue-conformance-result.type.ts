/**
 * Stackra file contract:
 * Purpose: `QueueConformanceResult`, what one case of the `QueueDriver` conformance suite answers: its id and every
 *          port rule the driver missed.
 * Boundary: a type only, in the `./testing` entry. An empty `mismatches` is a pass; the suite never throws for a miss,
 *           so one run reports every case.
 * Runtime: isomorphic
 * Governing contract: ADR 0148 (decisions 1, 2 and 3); ADR 0142; ADR 0269.
 */

/** One case's outcome. */
export interface QueueConformanceResult {
  /** The case id (`queue.priority`). */
  readonly caseId: string;

  /** Each rule the driver missed, in words; empty when it passed. */
  readonly mismatches: readonly string[];
}
