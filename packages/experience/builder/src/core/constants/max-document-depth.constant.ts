/**
 * Stackra file contract:
 * Purpose: `MAX_DOCUMENT_DEPTH`, the deepest a document tree may nest, the root counting as 1.
 * Boundary: a constant; `parseDocumentNode` refuses a deeper tree (`too_deep`) and the shared-document reader stops
 *           there, so a hostile document cannot exhaust the stack.
 * Runtime: isomorphic
 * Governing contract: ADR 0270 (decision 1: one validator); ADR 0154 (documents are bounded data).
 */

/** Levels of nesting a document may have; a page rarely needs ten. */
export const MAX_DOCUMENT_DEPTH = 32;
