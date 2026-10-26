/**
 * Stackra file contract:
 * Purpose: `KitStatus`, the review state of a kit or of one entry of its `versions.json`.
 * Boundary: an `Enum.of` value plus the type of the same name, in the leaf entry. The codes are the values the kit
 *           checker already accepts.
 * Runtime: isomorphic
 * Governing contract: ADR 0441 (as amended).
 */
import { Enum } from "@stackra/contracts";

/**
 * Kit review states.
 *
 * @example
 * if (kit.status !== KitStatus.Approved) issues.push({ code: "kit_not_approved", path: "kit.json" });
 */
export const KitStatus = Enum.of({
  /** Signed off; the only state a release build accepts by default. */
  Approved: "approved",
  /** A direction under review. */
  Proposed: "proposed",
  /** Reviewed and not taken. */
  Rejected: "rejected",
  /** Replaced by a newer version. */
  Superseded: "superseded",
  /** No longer used; a retired name keeps `name.en`. */
  Retired: "retired",
});

/** One of the codes above. */
export type KitStatus = Enum.Value<typeof KitStatus>;
