/**
 * Stackra file contract:
 * Purpose: `offlineMap(entries)`, the call gen writes in `#stackra/offline`: it records each consumed action's offline
 *          policy for the mutation queue and returns the `OfflineMap` the pending-changes view reads
 *          (`Offline.for(conflict.action)?.onConflict`).
 * Boundary: the entries are the producers' declared policies, copied by gen; this function checks only what the queue
 *           relies on (a readable retention and at least one resolution) and refuses the rest at boot, never at replay.
 * Runtime: isomorphic
 * Governing contract: ADR 0252 (decision 2: the `offline` option); ADR 0059 (decision 3); ADR 0294 (decision 17).
 */
import { duration } from "@stackra/validation";

import { OFFLINE_POLICIES } from "#core/constants/offline-policies.constant";
import type { OfflineActionRef } from "#core/types/offline-action-ref.type";
import type { OfflineEntry } from "#core/types/offline-entry.type";
import type { OfflineMap } from "#core/types/offline-map.type";

/**
 * Records `entries` for the queue and returns their lookup.
 *
 * @throws RangeError when an entry's `retention` is not a duration (`"72h"`) or its `onConflict` is empty.
 * @example
 * export const Offline = offlineMap([
 *   { action: CreateOrderAction, mode: OfflineMode.Queue, idMinting: IdMinting.Client,
 *     precondition: OfflinePrecondition.None, retention: "72h", onConflict: [ConflictResolution.Manual] },
 * ]);
 */
export function offlineMap(entries: readonly OfflineEntry[]): OfflineMap {
  const byKey = new Map<string, OfflineEntry>();
  for (const entry of entries) {
    duration(entry.retention);
    if (entry.onConflict.length === 0)
      throw new RangeError(
        `The offline policy of ${entry.action.key} offers no conflict resolution`,
      );
    byKey.set(entry.action.key, entry);
  }
  for (const [key, entry] of byKey) OFFLINE_POLICIES.set(key, entry);
  return Object.freeze({
    for: (action: OfflineActionRef | string) =>
      byKey.get(typeof action === "string" ? action : action.key),
  });
}
