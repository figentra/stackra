/**
 * Stackra file contract:
 * Purpose: `signal(initial)`, which makes one reactive value shared by everything that reads it: a module-level signal
 *          is one choice for the whole page (two pricing tables share the billing interval).
 * Boundary: plain state, no React import, so a driver can own one and update it outside a render. Equal values
 *           (`Object.is`) notify nobody; a listener that unsubscribes during notification does not stop the others.
 * Runtime: isomorphic
 * Governing contract: ADR 0079 (decisions 2 and 6).
 */
import type { StateSignal } from "#react/signal/state-signal.type";

/**
 * A new signal holding `initial`.
 *
 * @example
 * const chosen = signal<BillingInterval | null>(null);
 * chosen.set(BillingInterval.Year);
 * chosen.get(); // "year"
 */
export function signal<T>(initial: T): StateSignal<T> {
  let value = initial;
  const listeners = new Set<(value: T) => void>();
  return Object.freeze({
    get: () => value,
    set: (next: T) => {
      if (Object.is(value, next)) return;
      value = next;
      // oxlint-disable-next-line unicorn/no-useless-spread -- reason: a copy, so a listener that unsubscribes another mid-loop does not skip it
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
