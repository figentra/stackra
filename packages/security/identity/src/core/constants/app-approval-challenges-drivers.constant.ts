/**
 * Stackra file contract:
 * Purpose: `APP_APPROVAL_CHALLENGES_DRIVERS`, the names of this package's `AppApprovalChallenges` drivers, their file
 *          prefixes.
 * Boundary: the stand-in for the driver table gen writes into `#stackra/wiring`; the `DriverRegistry` augmentation and
 *           the config default read it. A product registers its own driver beside these.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 16: drivers named by file); STA-1304.
 */

/** The `AppApprovalChallenges` drivers of this package, by name; `memory` is the default and the only one here. */
export const APP_APPROVAL_CHALLENGES_DRIVERS = ["memory"] as const;
