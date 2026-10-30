/**
 * Stackra file contract:
 * Purpose: `HERO_VISIT`, where the landing hero's pick lives: this visit's hero (sessionStorage), the hero the device
 *          saw last (localStorage, read by the next visit) and the event a new pick is announced with.
 * Boundary: names only.
 * Runtime: browser
 * Governing contract: owner decision 2026-10-28 (a random first hero, then each return visit the next in turn).
 */

/** The storage keys and the event of the hero pick. */
export const HERO_VISIT = Object.freeze({
  session: "stackra-playground:hero",
  last: "stackra-playground:hero-last",
  event: "stackra-playground:hero",
});
