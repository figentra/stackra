/**
 * Stackra file contract:
 * Purpose: Stand-in barrel: the `./server` entry of @stackra/seo (`renderOgImage`), the Open Graph renderer of a Node
 *          server, until `stackra gen` writes the entry barrels (STA-339). The old `./og` entry is folded in (owner
 *          Q4).
 * Boundary: names its one re-export and declares nothing. Runs on a Node server only.
 * Runtime: node
 * Governing contract: ADR 0294 (decision 15); ADR 0127 2026-10-24 note (`./server` entry); the STA-347 stand-in barrel
 *                     decision.
 */
export { renderOgImage } from "#server/functions/render-og-image.function";
