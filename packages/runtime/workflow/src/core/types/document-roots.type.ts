/**
 * Stackra file contract:
 * Purpose: `DocumentRoots`, what a reference in an automation document may point into: the run's input (the trigger
 *          occurrence or the plan's input), the results of the steps done so far, the occurrence a waiting step
 *          received, and the current item of a for-each step.
 * Boundary: a type only, internal: `resolveRefs` and `lookupRef` read it.
 * Runtime: isomorphic
 * Governing contract: ADR 0122 (decision 3: data that references data and code).
 */

/** The roots of a reference. */
export interface DocumentRoots {
  /** The run's input, as JSON. */
  readonly input: unknown;

  /** Each done step's result, by step name. */
  readonly results: Readonly<Record<string, unknown>>;

  /** The occurrence a waiting step received. */
  readonly event?: unknown;

  /** The current item of a for-each step. */
  readonly item?: unknown;
}
