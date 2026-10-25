/**
 * Stackra file contract:
 * Purpose: Stand-in barrel: the `.` entry of @stackra/builder (the `Editor` kernel, `parseDocumentNode`, the document
 *          limits and patterns, and the refusals they raise) until `stackra gen` writes the entry barrels (STA-339).
 * Boundary: names each re-export and declares nothing. The types are the `./contracts` entry's; the hooks and the Yjs
 *           binding are the `./react` entry's (one symbol, one entry), so this entry loads neither React nor a CRDT
 *           library. `applyChange` and `blockIds` stay internal: `Editor` is the one way to change a document.
 * Runtime: isomorphic
 * Governing contract: ADR 0294 (decision 15); the STA-347 stand-in barrel decision.
 */
export { BLOCK_ID_PATTERN } from "#core/constants/block-id-pattern.constant";
export { BLOCK_KEY_PATTERN } from "#core/constants/block-key-pattern.constant";
export { MAX_DOCUMENT_BLOCKS } from "#core/constants/max-document-blocks.constant";
export { MAX_DOCUMENT_DEPTH } from "#core/constants/max-document-depth.constant";
export { BlockMoveInvalidError } from "#core/errors/block-move-invalid.error";
export { BlockNotFoundError } from "#core/errors/block-not-found.error";
export { BlockNotRegisteredError } from "#core/errors/block-not-registered.error";
export { DocumentInvalidError } from "#core/errors/document-invalid.error";
export { RootBlockLockedError } from "#core/errors/root-block-locked.error";
export { parseDocumentNode } from "#core/functions/parse-document-node.function";
export { Editor } from "#core/values/editor.value";
