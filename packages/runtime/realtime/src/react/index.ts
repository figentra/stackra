/**
 * Stackra file contract:
 * Purpose: Stand-in barrel: the `./react` entry of @stackra/realtime (`useRealtimeConnection`, `useSubscription`)
 *          until `stackra gen` writes the entry barrels (STA-339).
 * Boundary: names each re-export and declares nothing. Imports `.` and `./contracts` only; React Native uses the same
 *           hooks (no DOM).
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 15); the STA-347 stand-in barrel decision.
 */
export { useRealtimeConnection } from "#react/realtime/use-realtime-connection";
export { useSubscription } from "#react/realtime/use-subscription";
