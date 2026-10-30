/**
 * Stackra file contract:
 * Purpose: `useActiveSection`, the scroll spy of a component page. Of the given element ids the active one is the last whose top has passed the activation line, a
 *          quarter of the way down the viewport below the sticky bar (`activeSectionIndex`, with hysteresis; the last
 *          at the bottom of the page). A jump (`scrollToSection`) locks the choice to its target until the smooth scroll ends, so the rail
 *          does not run through the sections in between. With `syncHash` the address's hash follows the active
 *          section by `replaceState`, so scrolling adds no history entries.
 * Boundary: a rAF-throttled scroll and resize listener; the elements are looked up on each measure, so a lazily
 *           drawn section is found once it is there. Without `window` (a test) the first id is active.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 3.2 (scroll-spied TOC and section tabs).
 */
import { useEffect, useRef, useState } from "react";

import { activeSectionIndex } from "#src/components/toc-rail/active-section-index.function";
import { replaceHash } from "#src/components/toc-rail/replace-hash.function";
import { SECTION_LOCK } from "#src/components/toc-rail/section-lock.constant";

/** The active id among `ids`, the first one until the reader scrolls. */
export function useActiveSection(
  ids: readonly string[],
  { syncHash = false }: { syncHash?: boolean } = {},
): string | undefined {
  const [active, setActive] = useState<string | undefined>(ids[0]);
  const previous = useRef<number | undefined>(undefined);
  const joined = ids.join(" ");
  useEffect(() => {
    setActive(ids[0]);
    previous.current = undefined;
    if (typeof window === "undefined" || typeof window.addEventListener !== "function") return;
    let frame = 0;
    // The page these ids belong to: a scroll measured after a link has changed the route (before this effect is
    // cleaned up) must not stamp the old page's section onto the new page's address.
    const pathname = location.pathname;
    const measure = () => {
      frame = 0;
      const root = document.documentElement;
      // The sticky bar's height is the root's scroll padding (a jumped-to section lands just under it).
      const bar = Number.parseFloat(getComputedStyle(root).scrollPaddingTop) || 0;
      const line = bar + (window.innerHeight - bar) * 0.25;
      const isAtBottom =
        window.scrollY > 0 && window.innerHeight + window.scrollY >= root.scrollHeight - 2;
      const index = activeSectionIndex({
        tops: ids.map((id) => document.getElementById(id)?.getBoundingClientRect().top),
        line,
        isAtBottom,
        previous: previous.current,
        locked: SECTION_LOCK.id === undefined ? undefined : ids.indexOf(SECTION_LOCK.id),
      });
      previous.current = index;
      const id = ids[index];
      setActive(id);
      // Only once the reader has scrolled: a deep link's hash is kept until the page has jumped to it.
      if (
        syncHash &&
        SECTION_LOCK.id === undefined &&
        window.scrollY > 0 &&
        location.pathname === pathname
      )
        replaceHash(id);
    };
    const schedule = () => {
      if (frame === 0) frame = requestAnimationFrame(measure);
    };
    schedule();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    SECTION_LOCK.listeners.add(schedule);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      SECTION_LOCK.listeners.delete(schedule);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- the joined ids stand for the list
  }, [joined, syncHash]);
  return active;
}
