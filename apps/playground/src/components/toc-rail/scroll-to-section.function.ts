/**
 * Stackra file contract:
 * Purpose: `scrollToSection`, the jump a table of contents makes: scrolls the page to a section (smoothly
 *          unless motion is reduced), locks every scroll spy to it until the scroll ends (`scrollend`, or the reader
 *          taking the scroll back, or a timeout) and sets the hash without a history entry.
 * Boundary: DOM and window events only.
 * Runtime: browser
 * Governing contract: showcase redesign spec (2026-10-27) section 3.2 (scroll-spied TOC and section tabs).
 */
import { replaceHash } from "#src/components/toc-rail/replace-hash.function";
import { SECTION_LOCK } from "#src/components/toc-rail/section-lock.constant";

/**
 * Scrolls the page to the element `id` (smoothly unless motion is reduced: the root's `scroll-behavior`), marks it
 * active at once and keeps it so until the scroll ends; the hash follows without a history entry.
 */
export function scrollToSection(id: string): void {
  const target = document.getElementById(id);
  if (!target) return;
  SECTION_LOCK.set(id);
  replaceHash(id);
  const release = () => {
    window.removeEventListener("scrollend", release);
    window.removeEventListener("wheel", release);
    window.removeEventListener("touchstart", release);
    window.removeEventListener("keydown", release);
    clearTimeout(timer);
    if (SECTION_LOCK.id === id) SECTION_LOCK.set(undefined);
  };
  // shortcut: a 1.2 s fallback where `scrollend` is missing (Safari before 18.2); a longer jump unlocks a little early.
  const timer = setTimeout(release, 1200);
  window.addEventListener("scrollend", release, { once: true });
  // The reader taking the scroll back ends the lock at once.
  window.addEventListener("wheel", release, { once: true, passive: true });
  window.addEventListener("touchstart", release, { once: true, passive: true });
  window.addEventListener("keydown", release, { once: true });
  target.scrollIntoView?.({ block: "start" });
}
