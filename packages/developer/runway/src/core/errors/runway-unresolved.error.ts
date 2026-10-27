/**
 * Stackra file contract:
 * Purpose: `RunwayUnresolvedError`, thrown when a runway value cannot be resolved where it is read: no dev facts file
 *          (`stackra dev` has not run), a member absent from the facts, a dev reference outside dev, or a deploy-time
 *          value (`ref:`, `${pr}`) the build environment does not carry.
 * Boundary: a plain `Error` whose message says what to run or set. It names variables and members, never a value.
 * Runtime: isomorphic
 * Governing contract: ADR 0296 (decision 1), ADR 0173 (nobody reads a value).
 */

/**
 * A runway value that has no resolution here.
 *
 * @example
 * baseUrlOf("console"); // throws when `.stackra/dev/ports.json` does not exist: "run `stackra dev` first"
 */
export class RunwayUnresolvedError extends Error {
  /**
   * @param message - what is missing and how to provide it.
   */
  constructor(message: string) {
    super(message);
    this.name = "RunwayUnresolvedError";
  }
}
