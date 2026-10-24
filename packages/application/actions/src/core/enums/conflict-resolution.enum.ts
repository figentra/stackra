/**
 * Stackra file contract:
 * Purpose: `ConflictResolution`, the ways the pending-changes view may resolve a queued call that hit a conflict on
 *          replay.
 * Boundary: an enum (`Enum.of`) listed in an action's `offline.onConflict`, copied by gen into the clients' offline
 *           map and read by the console's pending-changes list. Nothing is merged silently.
 * Runtime: isomorphic
 * Governing contract: ADR 0252 (decision 2); ADR 0268 (R16: the experience package resolves conflicts); ADR 0294
 *                     (decision 16: Enum).
 */
import { Enum } from "@stackra/contracts";

/**
 * A resolution offered for a replay conflict.
 *
 * @example
 * Offline.for(conflict.action)?.onConflict ?? [ConflictResolution.Manual];
 */
export const ConflictResolution = Enum.of({
  /** Drop the queued call and keep the server's record. */
  ServerWins: "server_wins",
  /** Rebase the queued call on the server's record and send it again. */
  ClientRetry: "client_retry",
  /** Show both versions to the person, who decides. */
  Manual: "manual",
});

/** One of the values above. */
export type ConflictResolution = Enum.Value<typeof ConflictResolution>;
