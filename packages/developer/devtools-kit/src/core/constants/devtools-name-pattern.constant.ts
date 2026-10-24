/**
 * Stackra file contract:
 * Purpose: `DEVTOOLS_NAME_PATTERN`, the shape of a tab id, an RPC name and a stream channel: dotted lowercase
 *          segments, the package's key first (`router.tree`, `container.graph`, `cache.hit_rate`).
 * Boundary: a constant only; internal to the package (not exported from the entry).
 * Runtime: isomorphic
 * Governing contract: ADR 0231 (wire identifiers keep dots; machine codes are snake_case).
 */

/** One or more dot-separated segments, each a lowercase letter then letters, digits, `_` or `-`. */
export const DEVTOOLS_NAME_PATTERN = /^[a-z][a-z0-9_-]*(?:\.[a-z][a-z0-9_-]*)*$/;
