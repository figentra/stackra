/**
 * Stackra file contract:
 * Purpose: `treePath`, the `ltree` path of a `HasTree` record: its parent's path then its own id, or its id alone for
 *          a root.
 * Boundary: pure. The record's id is the path label, so it must be one `ltree` label (letters, digits, underscores or
 *           hyphens), which every `HasPublicId` id is.
 * Runtime: isomorphic
 * Governing contract: ADR 0321 (`HasTree`); ADR 0160 (`ltree`); data-layer gap mo16.
 */
/** One `ltree` label. */
const LABEL = /^[\w-]{1,1000}$/;

/**
 * The path of record `id` under the parent at `parentPath` (a root when absent).
 *
 * @throws TypeError when `id` is not an `ltree` label.
 * @example
 * treePath("cat_root.cat_shoes", "cat_boots"); // "cat_root.cat_shoes.cat_boots"
 */
export function treePath(parentPath: string | undefined, id: string): string {
  if (!LABEL.test(id))
    throw new TypeError(`"${id}" is not an ltree label, so it cannot name a tree node`);
  return parentPath === undefined ? id : `${parentPath}.${id}`;
}
