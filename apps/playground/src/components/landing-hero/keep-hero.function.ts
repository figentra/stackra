/**
 * Stackra file contract:
 * Purpose: `keepHero`, keeps a landing hero as this visit's (sessionStorage) and the device's last (localStorage).
 * Boundary: the two storages, guarded: a browser that refuses storage keeps nothing.
 * Runtime: browser
 * Governing contract: owner decision 2026-10-28 (a random first hero, then each return visit the next in turn).
 */
import { HERO_VISIT } from "./hero-visit.constant";

/** Keeps `id` as this visit's hero and the device's last one. */
export function keepHero(id: string): void {
  try {
    sessionStorage.setItem(HERO_VISIT.session, id);
    localStorage.setItem(HERO_VISIT.last, id);
  } catch {
    // shortcut: a browser that refuses storage picks again on the next page load; nothing else depends on it.
  }
}
