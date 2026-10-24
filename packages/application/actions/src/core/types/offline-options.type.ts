/**
 * Stackra file contract:
 * Purpose: `OfflineOptions`, an action's `offline` option: what a client's mutation queue may do with the action while
 *          offline, how long a queued call is kept and how a conflict on replay may be resolved.
 * Boundary: a type only, copied by gen into every consuming client's offline map; the server runs a replayed call
 *           through the same pipeline with its Idempotency-Key. Read only by clients, so the pipeline ignores it.
 * Runtime: isomorphic
 * Governing contract: ADR 0252 (decision 2: client-minted ids, version preconditions, retention, an `offline` option).
 */
import type { ConflictResolution } from "#core/enums/conflict-resolution.enum";
import type { IdMinting } from "#core/enums/id-minting.enum";
import type { OfflineMode } from "#core/enums/offline-mode.enum";
import type { OfflinePrecondition } from "#core/enums/offline-precondition.enum";

/** An action's offline policy. */
export interface OfflineOptions {
  /** What the queue does with the call. */
  readonly mode: OfflineMode;

  /** Who mints a new record's id. */
  readonly idMinting: IdMinting;

  /** What the replay checks. */
  readonly precondition: OfflinePrecondition;

  /** How long a queued call is kept, as a duration (`"72h"`). */
  readonly retention: string;

  /** The resolutions the pending-changes view may offer, in that order; at least one. */
  readonly onConflict: readonly ConflictResolution[];
}
