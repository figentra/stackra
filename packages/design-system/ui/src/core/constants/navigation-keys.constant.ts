/**
 * Stackra file contract:
 * Purpose: `NAVIGATION_KEYS`, the typed keys of the wave C navigation words in `assets/lang/<locale>/ui.json`: the
 *          Tabs overflow menu and close buttons, and the NavigationMenu's default name.
 * Boundary: internal: the web and native entries import it by path; no entry exports it. Each key exists in every base
 *           locale this package ships (ar, en, fr, de, es, it, nl).
 * Runtime: isomorphic
 * Governing contract: ADR 0080 (typed i18n keys); ADR 0231 (`<module>::<path>`); ADR 0403 (seven languages); STA-1371.
 */
import { keys } from "@stackra/i18n";

/** The navigation words' keys. */
export const NAVIGATION_KEYS = keys({
  ui: {
    tabs: ["more", "more_label", "close"],
    navigation_menu: ["label"],
  },
});
