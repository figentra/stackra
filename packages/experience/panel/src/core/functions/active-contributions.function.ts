/**
 * Stackra file contract:
 * Purpose: `activeContributions(items, installed)`, the contributions that are live for a tenant: every one that
 *          enhances no module, and those whose enhanced module is installed; the rest stay inert.
 * Boundary: pure; keeps the input order. A contribution to an enhanced module waits, inert, until that module is
 *           installed and goes inert again when it is removed, losing no data (its side tables are the owner's).
 * Runtime: isomorphic
 * Governing contract: ADR 0350 (decisions 4 and 5: enhanced modules, inert contributions).
 */

/**
 * The live contributions of `items`.
 *
 * @example
 * activeContributions(widgets, new Set(["orders", "tills"]));
 */
export function activeContributions<T extends { readonly enhances?: string }>(
  items: readonly T[],
  installed: ReadonlySet<string>,
): T[] {
  return items.filter((item) => item.enhances === undefined || installed.has(item.enhances));
}
