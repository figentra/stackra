/**
 * Stackra file contract:
 * Purpose: `MORPH_TABS_KEYS`, the typed keys of the web Morph tabs demos' words in `assets/lang/<locale>/morph_tabs.json`.
 * Boundary: keys only; the words live in the catalogues. A stand-in for the `#stackra/i18n` keys gen writes (STA-339).
 * Runtime: browser
 * Governing contract: ADR 0080 (typed i18n keys); ADR 0231 (`<module>::<path>`); ADR 0305 (catalogue layout).
 */
import { keys } from "@stackra/i18n";

/** The morph_tabs namespace's keys. */
export const MORPH_TABS_KEYS = keys({
  morph_tabs: ["label", "home", "orders", "menu", "settings", "showing"],
});
