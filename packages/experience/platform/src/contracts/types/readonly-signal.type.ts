/**
 * Stackra file contract:
 * Purpose: `ReadonlySignal<T>`, a live value a capability hands out: read it, or subscribe to it with `useSignal`
 *          (`useSignal(platform.network.isOnline)`). Only the driver that owns it writes it.
 * Boundary: a type only, the read half of `@stackra/state`'s `Signal`, so `useSignal` takes it as it is. Written out
 *           here, not picked from `Signal`, because contracts imports no other package entry (ADR 0117).
 * Runtime: isomorphic
 * Governing contract: ADR 0079 (decisions 2 and 6: signals); ADR 0250.
 */
/** A value to read and subscribe to, never to write. */
export interface ReadonlySignal<T> {
  /** The current value. */
  get: () => T;

  /** Calls `listener` with each new value; returns the unsubscribe function. */
  subscribe: (listener: (value: T) => void) => () => void;
}
