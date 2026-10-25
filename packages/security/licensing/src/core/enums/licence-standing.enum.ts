/**
 * Stackra file contract:
 * Purpose: `LicenceStanding`, the three steps of soft enforcement: a licence in force, an expired licence still in its
 *          grace period (warn), and read-only admin mode once the grace period is over or the licence is revoked.
 * Boundary: an `Enum.of` value plus the type of the same name. No standing deletes or hides data (ADR 0178 decision 4).
 * Runtime: isomorphic
 * Governing contract: ADR 0178 (decision 4, PK13); ADR 0294 (decision 16); ADR 0231 (snake_case codes).
 */
import { Enum } from "@stackra/contracts";

/** Where an install stands under its licence. */
export const LicenceStanding = Enum.of({
  /** The licence is in force; nothing is limited. */
  Active: "active",
  /** The licence expired and the grace period runs; the install warns and keeps working. */
  Grace: "grace",
  /** The grace period is over, or the licence is suspended or banned; admin works read-only, no new seats. */
  ReadOnly: "read_only",
});

/** One of the codes above. */
export type LicenceStanding = Enum.Value<typeof LicenceStanding>;
