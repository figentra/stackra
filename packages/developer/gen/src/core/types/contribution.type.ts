/**
 * Stackra file contract:
 * Purpose: `Contribution`, one entry a host's dependency records in a section of its manifest (a resource, a route, a
 *          menu, a command), with its key and the member it came from.
 * Boundary: a type only; built by `dependencyContributionsOf`.
 * Runtime: isomorphic
 * Governing contract: ADR 0111 (decision 3); STA-1947.
 */

/** One contributed entry and the member it came from. */
export interface Contribution<T> {
  /** The entry's key in its section. */
  readonly key: string;

  /** The entry as the manifest records it. */
  readonly entry: T;

  /** The package or service member that contributes it. */
  readonly from: string;
}
