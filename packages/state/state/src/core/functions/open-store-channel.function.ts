/**
 * Stackra file contract:
 * Purpose: `openStoreChannel`, which opens the `BroadcastChannel` named `stackra:state:<area>` for a persisted store and
 *          applies what other contexts of the origin commit to their instance of the same store.
 * Boundary: internal; a runtime without `BroadcastChannel` (native) and Node, which has one,
 *           get `undefined` and sync nothing: Node is skipped on purpose, since an open channel keeps the event loop alive and
 *           would hand one in-process store's state to the others. A message
 *           is `{ key, version, state }`: it is ignored when its key is another store's, its version is not
 *           `STORE_SYNC_VERSION` or its state is not an object; otherwise the state is validated as hydration does and
 *           listeners are notified. Applying never writes back or re-broadcasts: the committing context already
 *           persisted it. A channel never delivers to its own context's poster, so a context ignores its own messages.
 * Runtime: isomorphic
 * Governing contract: ADR 0079 (decision 2, cross-tab sync of persisted stores); ADR 0256.
 */
import { STORE_SYNC_VERSION } from "#core/constants/store-sync-version.constant";
import { applyStoreState } from "#core/functions/apply-store-state.function";
import type { StoreInternals } from "#core/types/store-internals.type";

/** Opens the sync channel of `store`, or `undefined` when the runtime has none. */
export function openStoreChannel(
  store: object,
  internals: StoreInternals,
  areaName: string,
): BroadcastChannel | undefined {
  if (typeof BroadcastChannel === "undefined") return undefined;
  if (
    typeof (globalThis as { process?: { versions?: { node?: string } } }).process?.versions
      ?.node === "string"
  )
    return undefined;
  const channel = new BroadcastChannel(`stackra:state:${areaName}`);
  channel.addEventListener("message", ({ data }: MessageEvent<unknown>) => {
    if (typeof data !== "object" || data === null) return;
    const message = data as { key?: unknown; version?: unknown; state?: unknown };
    if (message.key !== internals.key || message.version !== STORE_SYNC_VERSION) return;
    applyStoreState(store as Record<string, unknown>, internals, message.state, true);
  });
  return channel;
}
