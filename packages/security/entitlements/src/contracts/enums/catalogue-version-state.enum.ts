/**
 * Stackra file contract:
 * Purpose: `CatalogueVersionState`, where one dated version of a plan-catalogue record stands: waiting for its second
 *          approver, approved (it applies from its date, at each subscriber's renewal), or rejected.
 * Boundary: an `Enum.of` value plus the type of the same name. Only an approved version is ever in force.
 * Runtime: isomorphic
 * Governing contract: ADR 0391 (decisions 2 and 4); owner OS-381 (second approver for discounts).
 */
import { Enum } from "@stackra/contracts";

/** The states of a catalogue version. */
export const CatalogueVersionState = Enum.of({
  /** Proposed as a discount; waits for a second approver. */
  Pending: "pending",
  /** In force from its date. */
  Approved: "approved",
  /** Refused or withdrawn; never in force. */
  Rejected: "rejected",
});

/** One of the codes above. */
export type CatalogueVersionState = Enum.Value<typeof CatalogueVersionState>;
