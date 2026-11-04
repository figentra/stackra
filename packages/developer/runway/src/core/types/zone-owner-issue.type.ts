/**
 * Stackra file contract:
 * Purpose: `ZoneOwnerIssue`, one zone that more than one root runway claims, as `checkZoneOwners` reports it.
 * Boundary: type only.
 * Runtime: isomorphic
 * Governing contract: ADR 0519 (decision 5: one owner per zone), ADR 0231 (snake_case codes).
 */

/** One zone with more than one owner. */
export type ZoneOwnerIssue = {
  readonly code: "zone_owner_conflict";
  /** The zone name. */
  readonly subject: string;
  /** The runways that set `owner: true`, in the order given. */
  readonly owners: readonly string[];
  /** What is wrong, for `stackra validate` to print. */
  readonly message: string;
};
