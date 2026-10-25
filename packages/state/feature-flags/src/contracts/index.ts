/**
 * Stackra file contract:
 * Purpose: Stand-in barrel: the `./contracts` entry of @stackra/feature-flags (the `FlagProvider` port and the
 *          `FlagContext` it evaluates for) until `stackra gen` writes the entry barrels (STA-339).
 * Boundary: names each re-export and declares nothing. The leaf entry: it imports no other entry of this package
 *           (ADR 0294 decision 15).
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 15); the STA-347 stand-in barrel decision.
 */
export { FlagProvider } from "#contracts/ports/flag-provider.port";
export type { FlagContext } from "#contracts/types/flag-context.type";
