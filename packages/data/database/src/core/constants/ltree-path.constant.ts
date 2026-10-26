/**
 * Stackra file contract:
 * Purpose: `LTREE_PATH`, the shape of an `ltree` scope path: labels of letters, digits, `_` and `-`, root first,
 *          separated by dots.
 * Boundary: internal; shared by `scopeSettings` and `CrudService.repath`, so the settings and the subtree move accept
 *           the same paths. The shape also keeps `|` (the granted-paths separator) out of a path.
 * Runtime: node
 * Governing contract: ADR 0327 (decisions 3 and 5: a scope is an id and an `ltree` path).
 */

/** An `ltree` path. */
export const LTREE_PATH = /^[\w-]+(?:\.[\w-]+)*$/;
