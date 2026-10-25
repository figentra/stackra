/**
 * Stackra file contract:
 * Purpose: `MobileReleaseEnvironment`, one runway environment that ships the mobile app through EAS: its build
 *          profile, its update channel and the EAS environment runway syncs its values into.
 * Boundary: type only; `mobileInfraPlan` builds one per environment whose `destinations.mobile` is `eas`.
 * Runtime: isomorphic
 * Governing contract: ADR 0296 (decision 1: profiles and channels are member facts), ADR 0173 (decision 1: runway
 *                     syncs EAS environments), ADR 0170 (the four environments).
 */
import type { RunwayEnvironment } from "@stackra/runway";

/** One environment's mobile release. */
export type MobileReleaseEnvironment = {
  /** The runway environment. */
  readonly environment: RunwayEnvironment;
  /** The member runway's `release.mobile.profiles` key, which is also the eas.json build profile. */
  readonly profile: string;
  /** The EAS update channel. */
  readonly channel: string;
  /** The EAS environment the profile builds with; one per runway environment. */
  readonly easEnvironment: string;
};
