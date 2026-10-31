/**
 * Stackra file contract:
 * Purpose: `TAMO_MENU_KEYS`, the typed keys of the web tamo-menu demos' words in `assets/lang/<locale>/tamo_menu.json`.
 * Boundary: keys only; the words live in the catalogues. A stand-in for the `#stackra/i18n` keys gen writes (STA-339).
 * Runtime: browser
 * Governing contract: ADR 0080 (typed i18n keys); ADR 0231 (`<module>::<path>`); ADR 0305 (catalogue layout).
 */
import { keys } from "@stackra/i18n";

/** The tamo_menu namespace's keys. */
export const TAMO_MENU_KEYS = keys({
  tamo_menu: ["text", "chosen", "seo", "seo_hint"],
});
