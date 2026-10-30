/**
 * Stackra file contract:
 * Purpose: `scrollToSection`, the jump a table of contents makes: scrolls the page to a section (smoothly
 *          unless motion is reduced), locks every scroll spy to it until the scroll ends (`scrollend`, or the reader
 *          taking the scroll back, or a timeout; a scroll a loading demo cut short jumps again) and sets the hash
 *          without a history entry.
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
  let jumps = 0;
  let timer: ReturnType<typeof setTimeout>;
  const jump = () => {
    jumps += 1;
    clearTimeout(timer);
    // shortcut: a 1.2 s fallback where `scrollend` is missing (Safari before 18.2); a longer jump unlocks a little early.
    timer = setTimeout(release, 1200);
    target.scrollIntoView?.({ block: "start" });
  };
  // A demo above the section that loads mid-scroll moves it, and the scroll ends short of it: jump again (twice at
  // most) before the lock lets the spies mark where the page stopped.
  const landed = () => {
    const root = document.documentElement;
    const bar = Number.parseFloat(getComputedStyle(root).scrollPaddingTop) || 0;
    const isAtBottom = window.innerHeight + window.scrollY >= root.scrollHeight - 2;
    return isAtBottom || Math.abs(target.getBoundingClientRect().top - bar) <= 2;
  };
  const onScrollEnd = () => {
    if (jumps < 3 && !landed()) jump();
    else release();
  };
  const release = () => {
    window.removeEventListener("scrollend", onScrollEnd);
    window.removeEventListener("wheel", release);
    window.removeEventListener("touchstart", release);
    window.removeEventListener("keydown", release);
    clearTimeout(timer);
    if (SECTION_LOCK.id === id) SECTION_LOCK.set(undefined);
  };
  window.addEventListener("scrollend", onScrollEnd);
  // The reader taking the scroll back ends the lock at once.
  window.addEventListener("wheel", release, { once: true, passive: true });
  window.addEventListener("touchstart", release, { once: true, passive: true });
  window.addEventListener("keydown", release, { once: true });
  jump();
}
