/**
 * Stackra file contract:
 * Purpose: `chooseHero`, the Display menu's hero pick: keeps it for this visit (and as the device's last) and tells
 *          the landing page, which redraws in it.
 * Boundary: storage (guarded, `keepHero`) and a window event (`HERO_VISIT.event`).
 * Runtime: browser
 * Governing contract: owner decision 2026-10-28 (a Hero choice in the Display menu).
 */
import { HERO_VISIT } from "./hero-visit.constant";
import { keepHero } from "./keep-hero.function";

/** Switches this visit's hero to `id`. */
export function chooseHero(id: string): void {
  keepHero(id);
  window.dispatchEvent(new CustomEvent(HERO_VISIT.event, { detail: id }));
}
