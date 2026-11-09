/**
 * Stackra file contract:
 * Purpose: `byIndexThenPath`, the default order of a docs site's pages: a path ending in `index` first, then by path.
 *          `emitDocsSite` expands a `{ folder }` navigation entry in this order, and `navigationOfMeta` lists a
 *          folder with no `pages` (and the rest of a `...` entry) in it, so both inputs of the docs site agree.
 * Boundary: pure; a comparator for `Array#sort`.
 * Runtime: isomorphic
 * Governing contract: ADR 0002 (2026-10-27 amendment); ADR 0514 (amendment of 2026-11-09).
 */

/**
 * Compares two page paths: `index` first, then by path.
 *
 * @param a - one page path (`adr/index`, `adr/0001-x`).
 * @param b - the other.
 * @example
 * ["adr/0002", "adr/index", "adr/0001"].sort(byIndexThenPath); // ["adr/index", "adr/0001", "adr/0002"]
 */
export function byIndexThenPath(a: string, b: string): number {
  const ai = a.endsWith("index") ? 0 : 1;
  const bi = b.endsWith("index") ? 0 : 1;
  return ai - bi || (a < b ? -1 : a > b ? 1 : 0);
}
