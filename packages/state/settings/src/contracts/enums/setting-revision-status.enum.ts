/**
 * Stackra file contract:
 * Purpose: `SettingRevisionStatus`, where a settings revision stands: waiting for a second approver, scheduled for a
 *          later time, applied, or rejected.
 * Boundary: an `Enum.of` value plus the type of the same name. A revision moves pending to scheduled or applied,
 *           scheduled to applied, and pending or scheduled to rejected; applied and rejected are final.
 * Runtime: isomorphic
 * Governing contract: ADR 0213 (decision 5: revisions, four-eyes approval, scheduled changes); ADR 0231 (codes).
 */
import { Enum } from "@stackra/contracts";

/** The states of a revision. */
export const SettingRevisionStatus = Enum.of({
  /** It changes a key marked `approval` and waits for a second approver. */
  Pending: "pending",
  /** Approved (or needing no approval) and waiting for its effective time. */
  Scheduled: "scheduled",
  /** Its values are in the store. */
  Applied: "applied",
  /** Rejected or withdrawn before it applied. */
  Rejected: "rejected",
});

/** One of the codes above. */
export type SettingRevisionStatus = Enum.Value<typeof SettingRevisionStatus>;
