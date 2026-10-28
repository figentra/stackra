/**
 * Stackra file contract:
 * Purpose: `liveValue(initial)`, the live values of the memory platform (online state, launched files, the badge
 *          count, a held install prompt), readable with `useSignal` like any `@stackra/state` signal.
 * Boundary: internal; not exported from the entry. The `.` entry may not load `@stackra/state/react` (core imports no
 *           host library), so this is the same contract written without it: equal values notify nobody, and a
 *           listener that unsubscribes during notification does not stop the others.
 * Runtime: isomorphic
 * Governing contract: ADR 0079 (decisions 2 and 6); ADR-0004 §1 (core imports no host library).
 */
import type { LiveValue } from "#core/types/live-value.type";

/**
 * A live value holding `initial`.
 *
 * @example
 * const isOnline = liveValue(true);
 * isOnline.set(false);
 */
export function liveValue<T>(initial: T): LiveValue<T> {
  let value = initial;
  const listeners = new Set<(value: T) => void>();
  return Object.freeze({
    get: () => value,
    set: (next: T) => {
      if (Object.is(value, next)) return;
      value = next;
      // oxlint-disable-next-line unicorn/no-useless-spread -- a snapshot: a listener may unsubscribe while it runs
      for (const listener of [...listeners]) listener(next);
    },
    subscribe: (listener: (value: T) => void) => {
      const entry = (next: T) => listener(next);
      listeners.add(entry);
      return () => {
        listeners.delete(entry);
      };
    },
  });
}
