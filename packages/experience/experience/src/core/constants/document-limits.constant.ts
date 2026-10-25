/**
 * Stackra file contract:
 * Purpose: `DOCUMENT_LIMITS`, the default bounds `validateDocument` holds a stored or received document to: 32 levels
 *          and 10,000 blocks, the builder's own bounds.
 * Boundary: internal; a caller may pass tighter bounds. These are a safety limit of the mechanism (a document is
 *           untrusted input at the save and publish boundary), not a business value.
 * Runtime: isomorphic
 * Governing contract: ADR 0110 (decision 4); ADR 0154 (documents are data).
 */

/** The default depth and size bounds. */
export const DOCUMENT_LIMITS = Object.freeze({ maxDepth: 32, maxBlocks: 10_000 });
