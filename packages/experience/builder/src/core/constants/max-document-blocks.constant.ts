/**
 * Stackra file contract:
 * Purpose: `MAX_DOCUMENT_BLOCKS`, the most block instances one document may hold.
 * Boundary: a constant; `parseDocumentNode` refuses a larger tree (`too_many_blocks`), which bounds the work one
 *           stored or shared document can cause in every editor that opens it.
 * Runtime: isomorphic
 * Governing contract: ADR 0270 (decision 1: one validator); ADR 0154 (documents are bounded data).
 */

/** Blocks one document may hold, its root included. */
export const MAX_DOCUMENT_BLOCKS = 10_000;
