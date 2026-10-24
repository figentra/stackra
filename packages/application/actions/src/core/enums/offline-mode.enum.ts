/**
 * Stackra file contract:
 * Purpose: `OfflineMode`, what a client's mutation queue may do with an action while it is offline.
 * Boundary: an enum (`Enum.of`) written in an action's `offline` option and copied by gen into each client's offline
 *           map (`#stackra/offline`). An action with no `offline` option is online-only and refuses at once offline.
 * Runtime: isomorphic
 * Governing contract: ADR 0252 (decision 2: an `offline` option on the action); ADR 0294 (decision 16: Enum).
 */
import { Enum } from "@stackra/contracts";

/**
 * An action's offline behaviour.
 *
 * @example
 * offline: { mode: OfflineMode.Queue, idMinting: IdMinting.Client, precondition: OfflinePrecondition.None, retention: "72h", onConflict: [ConflictResolution.Manual] }
 */
export const OfflineMode = Enum.of({
  /** The call is kept in the client's queue and replayed, with its Idempotency-Key, once online. */
  Queue: "queue",
});

/** One of the values above. */
export type OfflineMode = Enum.Value<typeof OfflineMode>;
