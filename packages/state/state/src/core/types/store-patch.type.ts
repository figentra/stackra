/**
 * Stackra file contract:
 * Purpose: `StorePatch<S>`, what a store's `set` takes: the changed fields, or a function of the current state that
 *          returns them.
 * Boundary: a type only. Field names are checked at runtime by `set` (an unknown field throws): a mapped type over the
 *           polymorphic `this` does not accept an object literal inside the class, so the static type is a record.
 * Runtime: isomorphic
 * Governing contract: ADR 0079 (decision 2); ADR 0294 (decision 16).
 */

/** The fields to change, or a function of the store that returns them. */
export type StorePatch<S> =
  | Readonly<Record<string, unknown>>
  | ((state: S) => Readonly<Record<string, unknown>>);
