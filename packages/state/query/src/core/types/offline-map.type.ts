/**
 * Stackra file contract:
 * Purpose: `OfflineMap`, what `offlineMap([...])` returns (the generated `Offline` of `#stackra/offline`): the offline
 *          policy of an action, looked up by its class or by its key (a conflict record holds the key).
 * Boundary: a type only. An action the map does not list is online-only.
 * Runtime: isomorphic
 * Governing contract: ADR 0252 (decision 2); ADR 0059 (decision 3).
 */
import type { OfflineActionRef } from "#core/types/offline-action-ref.type";
import type { OfflineEntry } from "#core/types/offline-entry.type";

/** The offline policies of a client's consumed actions. */
export interface OfflineMap {
  /**
   * The policy of `action`, or `undefined` when it is online-only.
   *
   * @example
   * Offline.for(conflict.action)?.onConflict ?? [ConflictResolution.Manual];
   */
  for(action: OfflineActionRef | string): OfflineEntry | undefined;
}
