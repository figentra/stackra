/**
 * Stackra file contract:
 * Purpose: `RegionIssue`, one region or cloud failure `checkRegions` reports: where it is, a snake_case code, the
 *          region or account concerned and a message.
 * Boundary: type only.
 * Runtime: isomorphic
 * Governing contract: ADR 0354 (decision 4 and enforcement), ADR 0231 (snake_case codes), ADR 0400.
 */
import type { RunwayEnvironment } from "#core/enums/runway-environment.enum";

/** One region failure. */
export type RegionIssue = {
  /** The environment that names the region; absent for a failure of the `regions` section itself. */
  readonly environment?: RunwayEnvironment;
  /**
   * `unknown_region` (an environment or dedicated deployment lists a region the root does not declare),
   * `cloud_unconfigured` (a region's or an environment's cloud has no `providers` section) or `unknown_account` (a
   * `cloud.account` the provider section does not hold).
   */
  readonly code: "unknown_region" | "cloud_unconfigured" | "unknown_account";
  /** The region key, or the account key for `unknown_account`. */
  readonly subject: string;
  /** What is wrong, for `stackra validate` to print. */
  readonly message: string;
};
