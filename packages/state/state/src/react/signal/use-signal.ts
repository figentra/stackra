/**
 * Stackra file contract:
 * Purpose: `useSignal(s)`, the hook a component reads a signal with: the current value, and a re-render whenever it
 *          changes.
 * Boundary: subscribes through React's `useSyncExternalStore`, so concurrent renders never tear; the server snapshot is
 *           the same value. Takes anything that can be read and subscribed, so a package may hand out a read-only view
 *           of its signal.
 * Runtime: isomorphic
 * Governing contract: ADR 0079 (decisions 2 and 6).
 */
import { useSyncExternalStore } from "react";

import type { Signal } from "#react/signal/signal.type";

/**
 * The current value of `source`.
 *
 * @example
 * const isOnline = useSignal(platform.network.isOnline);
 */
export function useSignal<T>(source: Pick<Signal<T>, "get" | "subscribe">): T {
  return useSyncExternalStore(source.subscribe, source.get, source.get);
}
