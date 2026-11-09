/**
 * Stackra file contract:
 * Purpose: `isEventBump(before, after)`, whether an integration event wire name `<stem>.v<n>` became the same stem at a
 *          higher version: the sanctioned bump that the identity lock accepts and `compareManifests` does not count as
 *          a removal (STA-2057).
 * Boundary: pure.
 * Runtime: isomorphic
 * Governing contract: ADR 0305 (rule 5: the event version bump).
 */

/** The stem and version of a wire name `<stem>.v<n>`. */
const VERSIONED = /^(.+)\.v(\d+)$/;

/**
 * Whether `after` is `before` at a higher version.
 *
 * @example
 * isEventBump("orders.order.paid.v1", "orders.order.paid.v2"); // true
 * isEventBump("orders.order.paid.v2", "orders.order.paid.v1"); // false
 */
export function isEventBump(before: string, after: string): boolean {
  const old = VERSIONED.exec(before);
  const now = VERSIONED.exec(after);
  return old !== null && now !== null && old[1] === now[1] && Number(now[2]) > Number(old[2]);
}
