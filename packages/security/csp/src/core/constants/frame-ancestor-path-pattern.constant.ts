/**
 * Stackra file contract:
 * Purpose: `FRAME_ANCESTOR_PATH_PATTERN`, the grammar of a `frameAncestors` key: an exact path (`/preview`) or a
 *          prefix that ends in `/*` (`/c/*`, `/*`).
 * Boundary: no `*` elsewhere, no whitespace, query or fragment. Internal: not exported from the entry.
 * Runtime: isomorphic
 * Governing contract: ADR 0237 (edge headers); ADR 0334 rule 12.
 */

/** An exact path, or a path prefix ending in `/*`. */
export const FRAME_ANCESTOR_PATH_PATTERN = /^(?:\/[^\s*?#]*|\/(?:[^\s*?#]*\/)?\*)$/;
