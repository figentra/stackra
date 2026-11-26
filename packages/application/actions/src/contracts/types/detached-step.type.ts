/**
 * Stackra file contract:
 * Purpose: `DetachedStep`, one step of a detached call (`DetachedCall.isolated`): `work` in its own transaction with the
 *          call's isolation, as a `DETACHED_RUNS` wrapper receives it.
 * Boundary: a type only; it names no class of `core`, so `./contracts` stays a leaf.
 * Runtime: isomorphic
 * Governing contract: ADR 0495 (decisions 1 and 2); ADR 0294 (decision 15).
 */

/** Runs `work` as one step of a detached call: its own transaction with the call's isolation. */
export type DetachedStep = <T>(work: () => Promise<T>) => Promise<T>;
