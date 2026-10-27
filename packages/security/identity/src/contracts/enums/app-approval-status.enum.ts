/**
 * Stackra file contract:
 * Purpose: `AppApprovalStatus`, where an app approval challenge stands: waiting for the app, approved, denied, lapsed,
 *          or approved and already turned into a grant.
 * Boundary: an `Enum.of` value plus the type of the same name. Only `pending` moves; every other status is final. The
 *           requesting device never sees these: it sees `pending`, `approved` or `ended`, so a denied, lapsed or
 *           unknown-account challenge all look the same to it.
 * Runtime: isomorphic
 * Governing contract: STA-1304 (owner request 2026-10-27).
 */
import { Enum } from "@stackra/contracts";

/** The statuses of a challenge. */
export const AppApprovalStatus = Enum.of({
  /** Waiting for the signed-in app. */
  Pending: "pending",
  /** Approved in the app; the requester may complete it once. */
  Approved: "approved",
  /** Denied in the app, or a wrong number was picked. */
  Denied: "denied",
  /** Its time to live ran out, or a newer challenge from the same device replaced it. */
  Expired: "expired",
  /** Approved and completed: the grant was handed out. */
  Completed: "completed",
});

/** One of the codes above. */
export type AppApprovalStatus = Enum.Value<typeof AppApprovalStatus>;
