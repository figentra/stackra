/**
 * Stackra file contract:
 * Purpose: `LONG_TAIL_KEYS`, the typed keys of the wave D long-tail components' own words in
 *          `assets/lang/<locale>/ui.json` (`ui::marquee.*`, `ui::barcode.*`, `ui::page_indicator.*`,
 *          `ui::back_to_top.*`, `ui::footer.*`).
 * Boundary: internal: the web and native components import it by path. Kept apart from `UI_KEYS` so wave D lands
 *           without editing the shared key list; it folds into `UI_KEYS` when that is next touched.
 * Runtime: isomorphic
 * Governing contract: ADR 0080 (typed i18n keys); ADR 0231 (`<module>::<path>`); ADR 0403 (seven languages);
 *          STA-1371 (wave D, owner approval 2026-10-30).
 */
import { keys } from "@stackra/i18n";

/** The long-tail components' keys. */
export const LONG_TAIL_KEYS = keys({
  ui: {
    marquee: ["pause", "play"],
    barcode: ["invalid"],
    page_indicator: ["pages", "page"],
    back_to_top: ["label"],
    footer: ["label"],
  },
});
