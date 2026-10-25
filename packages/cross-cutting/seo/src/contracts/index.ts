/**
 * Stackra file contract:
 * Purpose: Stand-in barrel: the `./contracts` entry of @stackra/seo, the leaf entry of its port and the card type its
 *          signature names, until `stackra gen` writes the entry barrels (STA-339).
 * Boundary: names each re-export and declares nothing. The leaf: it imports no other entry of this package.
 *           `OgRenderer` is exported from here only, never from `.` (ADR 0294 decision 15).
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 15); the STA-347 stand-in barrel decision.
 */
export { OgRenderer } from "#contracts/ports/og-renderer.port";
export type { OgCard } from "#contracts/types/og-card.type";
