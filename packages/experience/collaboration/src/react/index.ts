/**
 * Stackra file contract:
 * Purpose: Stand-in barrel: the `./react` entry of @stackra/collaboration (`usePresence`, `useCursors`,
 *          `useSharedDocument` and the Yjs binding `yjsReplica`) until `stackra gen` writes the entry barrels
 *          (STA-339).
 * Boundary: names each re-export and declares nothing. Imports `.` and `./contracts` only; the one entry that loads
 *           Yjs (an optional peer). React Native uses the same hooks (no DOM).
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 15); the STA-347 stand-in barrel decision.
 */
export { useCursors } from "#react/cursors/use-cursors";
export { usePresence } from "#react/presence/use-presence";
export { useSharedDocument } from "#react/shared-document/use-shared-document";
export { yjsReplica } from "#react/shared-document/yjs-replica.function";
