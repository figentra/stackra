/**
 * Stackra file contract:
 * Purpose: `PlayApp`, a Google Play app as the `PlayConsole` port answers it: whether any track has a release, which
 *          tells whether the one-time manual first upload is done.
 * Boundary: type only.
 * Runtime: isomorphic
 * Governing contract: ADR 0482 (decision 6).
 */

/** One Play app. */
export type PlayApp = {
  /** Some track has a release (the manual first upload is done). */
  readonly hasRelease: boolean;
};
