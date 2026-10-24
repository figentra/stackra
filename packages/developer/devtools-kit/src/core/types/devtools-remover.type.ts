/**
 * Stackra file contract:
 * Purpose: `DevtoolsRemover`, what `defineTab` and `defineRpc` return: removes that one registration.
 * Boundary: a type only.
 * Runtime: isomorphic
 * Governing contract: ADR 0246 (decision 4).
 */

/** Removes its registration; safe to call twice, and a no-op once a newer definition replaced it. */
export type DevtoolsRemover = () => void;
