/**
 * Stackra file contract:
 * Purpose: `OfflineEntry`, one row of the offline map: a consumed action and the `offline` policy its producer declared
 *          (mode, id minting, replay precondition, retention, the conflict resolutions the UI may offer, the cap with
 *          its amount field).
 * Boundary: a type only; the policy is `@stackra/actions`' `OfflineOptions`, copied by gen from the producer's
 *           manifest, so this package re-declares none of its enums.
 * Runtime: isomorphic
 * Governing contract: ADR 0252 (decision 2: the `offline` option); ADR 0059 (decision 3); ADR 0338 (decision 5).
 */
import type { OfflineOptions } from "@stackra/actions";

import type { OfflineActionRef } from "#core/types/offline-action-ref.type";

/**
 * An action and its offline policy.
 *
 * @example
 * { action: CreateOrderAction, mode: OfflineMode.Queue, idMinting: IdMinting.Client, precondition: OfflinePrecondition.None, retention: "72h", onConflict: [ConflictResolution.Manual] }
 */
export interface OfflineEntry extends OfflineOptions {
  /** The action's generated class. */
  readonly action: OfflineActionRef;
}
