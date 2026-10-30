/**
 * Stackra file contract:
 * Purpose: `SECTION_LOCK`, the section a table-of-contents jump is scrolling to, shared by every scroll spy on
 *          the page so each marks the target at once and holds it until the scroll ends.
 * Boundary: module state only; `scrollToSection` sets it, `useActiveSection` reads and listens.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 3.2 (scroll-spied TOC and section tabs).
 */

/** The locked section (`id`, `undefined` when none) and the spies to tell when it changes. */
export const SECTION_LOCK = {
  id: undefined as string | undefined,
  listeners: new Set<() => void>(),
  set(id: string | undefined) {
    this.id = id;
    for (const listener of this.listeners) listener();
  },
};
