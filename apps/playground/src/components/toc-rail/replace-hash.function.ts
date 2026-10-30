/**
 * Stackra file contract:
 * Purpose: `replaceHash`, sets the address's hash to `#<id>` without a history entry, keeping the router's
 *          state; nothing when it is already there.
 * Boundary: the History API only.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 3.2 (scroll-spied TOC and section tabs).
 */

/** Writes `#id` into the address bar with `replaceState`. */
export function replaceHash(id: string | undefined): void {
  if (!id) return;
  const hash = `#${id}`;
  if (location.hash === hash) return;
  history.replaceState(history.state, "", `${location.pathname}${location.search}${hash}`);
}
