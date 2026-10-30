/**
 * Stackra file contract:
 * Purpose: `FULLSCREEN_BAR_KEYS`, the typed keys of the FullscreenBar's own words in `assets/lang/<locale>/ui.json` (`ui::fullscreen_bar.*`).
 * Boundary: internal: the web and native components import it by path. Kept apart from `UI_KEYS` so the gap
 *           components land without editing the shared key list; it folds into `UI_KEYS` when that is next touched.
 * Runtime: isomorphic
 * Governing contract: ADR 0080 (typed i18n keys); ADR 0231 (`<module>::<path>`); ADR 0403 (seven languages).
 */
import { keys } from "@stackra/i18n";

/** The FullscreenBar's keys. */
export const FULLSCREEN_BAR_KEYS = keys({
  ui: {
    fullscreen_bar: ["exit", "reveal", "reveal_locked"],
  },
});
