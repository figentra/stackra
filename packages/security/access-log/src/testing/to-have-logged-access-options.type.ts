/**
 * Stackra file contract:
 * Purpose: `ToHaveLoggedAccessOptions`, what `expect(sink).toHaveLoggedAccess(...)` looks for.
 * Boundary: a type in its own file beside the matcher (one declaration per file), exported from the `./testing` entry
 *           only, because only tests build it.
 * Runtime: isomorphic
 * Governing contract: ADR 0269 (decision 3); ADR 0305 (one declaration per file).
 */

/** Every given field must match one record. */
export interface ToHaveLoggedAccessOptions {
  /** The `<Class>.<method>` the record must name. */
  readonly target: string;

  /** Public ids that must all appear among the record's subjects. */
  readonly subjects?: readonly string[];

  /** The public id the record's actor must carry. */
  readonly actorId?: string;
}
