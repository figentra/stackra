/**
 * Stackra file contract:
 * Purpose: Stand-in barrel: the `./react` entry of @stackra/state (`signal`, `useSignal`, `useStore`, the `Signal` type)
 *          until `stackra gen` writes the entry barrels (STA-339).
 * Boundary: names each re-export and declares nothing.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 15); the STA-347 stand-in barrel decision.
 */
export { signal } from "#react/signal/signal.function";
export type { Signal } from "#react/signal/signal.type";
export { useSignal } from "#react/signal/use-signal";
export { useStore } from "#react/store/use-store";
