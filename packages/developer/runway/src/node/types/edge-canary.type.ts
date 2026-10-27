/**
 * Stackra file contract:
 * Purpose: `EdgeCanary<R>`, a release on its canary: the release itself, the scopes that get it first and when the
 *          canary started. The value of a `canary:<product>:<surface>` row (R = `EdgeRelease`) and of a shell row's
 *          `canary` (R = `EdgeShellRelease`).
 * Boundary: type only. `scopes` are scope ids (the internal and demo scopes, D6); `since` is an ISO 8601 instant.
 * Runtime: node
 * Governing contract: owner decision D6; app-shells 5.3 and 16 (points 3 and 4); ADR 0323 and R-59 (scope).
 */

/** A release served to the canary scopes first. */
export type EdgeCanary<R> = R & {
  /** The scope ids on the canary. */
  readonly scopes: readonly string[];
  /** When the canary started, ISO 8601. */
  readonly since: string;
};
