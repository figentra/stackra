/**
 * Stackra file contract:
 * Purpose: Stand-in barrel: the `./react` entry of @stackra/native-share (`useIncomingShare`) until `stackra gen`
 *          writes the entry barrels (STA-339).
 * Boundary: names each re-export and declares nothing; it imports no React Native module, the driver supplies what
 *           differs.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 15); the STA-347 stand-in barrel decision.
 */
export type { IncomingShareState } from "#react/incoming-share/incoming-share-state.type";
export { useIncomingShare } from "#react/incoming-share/use-incoming-share";
