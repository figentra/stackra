/**
 * Stackra file contract:
 * Purpose: `HostIssue`, one surface host failure of a root runway (STA-1796): two surfaces that resolve to the same host
 *          in an environment, where the edge's one KV row per host would serve only the second.
 * Boundary: type only; `checkHosts` returns them, `parseRunway` and `platformRows` refuse with them.
 * Runtime: isomorphic
 * Governing contract: ADR 0437 (one KV row per host); STA-1796.
 */

/** One host failure. */
export type HostIssue = {
  /** `host_collision`: two surfaces resolve to one host. */
  readonly code: "host_collision";
  /** The resolved host both claim. */
  readonly host: string;
  /** The environment the host resolves in. */
  readonly environment: string;
  /** The two surfaces, the first claimant then the second. */
  readonly surfaces: readonly [string, string];
  /** The dotted runway path of the second claim. */
  readonly path: string;
  /** What is wrong, for `stackra validate` and `runway` to print. */
  readonly message: string;
};
