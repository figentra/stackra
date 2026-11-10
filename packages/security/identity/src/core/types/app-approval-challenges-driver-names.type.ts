/**
 * Stackra file contract:
 * Purpose: the `DriverRegistry` entry of `AppApprovalChallenges`, so `DriverName<AppApprovalChallenges>` is
 *          `"memory"`.
 * Boundary: a module augmentation only; the stand-in for the one gen writes into `#stackra/wiring` (STA-339).
 *           `IdentityOptions` imports this file so the augmentation travels with the config shape.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 16); ADR 0263 (gen writes the wiring).
 */
import type { APP_APPROVAL_CHALLENGES_DRIVERS } from "#core/constants/app-approval-challenges-drivers.constant";

declare module "@stackra/container" {
  interface DriverRegistry {
    /** The driver names of `AppApprovalChallenges` (`memory`). */
    "identity.AppApprovalChallenges": (typeof APP_APPROVAL_CHALLENGES_DRIVERS)[number];
  }
}
