/**
 * Stackra file contract:
 * Purpose: `StateSignal<T>`, one reactive value: read it, set it, subscribe to its changes. `signal(initial)` makes one and
 *          `useSignal(s)` reads it in a component; packages expose live values as signals (the platform's
 *          `network.isOnline`).
 * Boundary: a type only. The methods are bound closures, so `s.subscribe` can be handed on without `this`.
 * Runtime: isomorphic
 * Governing contract: ADR 0079 (decisions 2 and 6: the ported signals primitive);
 *                     STA-1383 (renamed from Signal: workflow's Signal is the run signal kind).
 */

/** One reactive value. */
export interface StateSignal<T> {
  /** The current value. */
  get(): T;

  /** Replaces the value and notifies subscribers; a value equal by `Object.is` changes nothing. */
  set(next: T): void;

  /** Calls `listener` with each new value; returns the unsubscribe function. */
  subscribe(listener: (value: T) => void): () => void;
}
