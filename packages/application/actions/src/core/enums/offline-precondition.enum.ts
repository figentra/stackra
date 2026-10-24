/**
 * Stackra file contract:
 * Purpose: `OfflinePrecondition`, what a queued offline call checks when it replays: nothing, or the version of the
 *          record it was made against.
 * Boundary: an enum (`Enum.of`) of an action's `offline` option, copied by gen into the clients' offline map. A
 *           version mismatch on replay is a `409` the pending-changes view resolves with `onConflict`.
 * Runtime: isomorphic
 * Governing contract: ADR 0252 (decision 2: version preconditions on writes); ADR 0294 (decision 16: Enum).
 */
import { Enum } from "@stackra/contracts";

/**
 * The replay check of a queued call.
 *
 * @example
 * offline: { mode: OfflineMode.Queue, precondition: OfflinePrecondition.Version, ... }
 */
export const OfflinePrecondition = Enum.of({
  /** Nothing is checked on replay (a create with a client-minted id). */
  None: "none",
  /** The replay sends the record version it saw; a newer server version is a conflict. */
  Version: "version",
});

/** One of the values above. */
export type OfflinePrecondition = Enum.Value<typeof OfflinePrecondition>;
