/**
 * Stackra file contract:
 * Purpose: `MobileIds`, a mobile app's store ids: the iOS bundle id and the Android package name.
 * Boundary: type only; `mobileIdsOf` answers it.
 * Runtime: isomorphic
 * Governing contract: ADR 0439 (decision 6), ADR 0482 (decision 2).
 */

/** The two store ids of one app. */
export type MobileIds = {
  /** The iOS bundle id. */
  readonly bundleId: string;
  /** The Android package name. */
  readonly packageName: string;
};
