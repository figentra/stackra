/**
 * Stackra file contract:
 * Purpose: `RegionIssue`, one region failure `checkRegions` reports: where it is, a snake_case code, the region
 *          concerned and a message.
 * Boundary: type only.
 * Runtime: isomorphic
 * Governing contract: ADR 0354 (decision 4 and enforcement), ADR 0231 (snake_case codes).
 */
import type { RunwayEnvironment } from "#core/enums/runway-environment.enum";

/** One region failure. */
export type RegionIssue = {
  /** The environment that names the region; absent for a failure of the `regions` section itself. */
  readonly environment?: RunwayEnvironment;
  /**
   * `unknown_region` (an environment lists a region the root does not declare) or `cloud_unconfigured` (a region's
   * cloud has no `providers` section).
   */
  readonly code: "unknown_region" | "cloud_unconfigured";
  /** The region key. */
  readonly subject: string;
  /** What is wrong, for `stackra validate` to print. */
  readonly message: string;
};
