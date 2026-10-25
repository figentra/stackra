/**
 * Stackra file contract:
 * Purpose: `BLOCK_KEY_PATTERN`, what a registered block's key looks like: dot-separated snake_case segments, at least
 *          two (`web.hero_section`).
 * Boundary: a constant, the same rule experience's `registerBlocks` applies; `parseDocumentNode` refuses another key
 *           (`block_invalid`) and the shared-document reader skips a block that has one. Whether the key is
 *           registered is `Editor.problems`'s.
 * Runtime: isomorphic
 * Governing contract: ADR 0270 (decision 3: the palette is code); ADR 0294 (decision 20: derived keys).
 */

/** A block key. */
export const BLOCK_KEY_PATTERN = /^[a-z][a-z0-9_]*(?:\.[a-z][a-z0-9_]*)+$/;
