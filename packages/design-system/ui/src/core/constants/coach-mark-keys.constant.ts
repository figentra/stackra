/**
 * Stackra file contract:
 * Purpose: `COACH_MARK_KEYS`, the typed keys of the CoachMark's own words in `assets/lang/<locale>/ui.json` (`ui::coach_mark.*`).
 * Boundary: internal: the web and native components import it by path. Kept apart from `UI_KEYS` so the gap
 *           components land without editing the shared key list; it folds into `UI_KEYS` when that is next touched.
 * Runtime: isomorphic
 * Governing contract: ADR 0080 (typed i18n keys); ADR 0231 (`<module>::<path>`); ADR 0403 (seven languages).
 */
import { keys } from "@stackra/i18n";

/** The CoachMark's keys. */
export const COACH_MARK_KEYS = keys({
  ui: {
    coach_mark: ["progress", "back", "next", "done", "skip"],
  },
});
