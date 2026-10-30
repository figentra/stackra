/**
 * Stackra file contract:
 * Purpose: `INPUT_KEYS`, the typed keys of the TreeSelect's and the MentionInput's own words in
 *          `assets/lang/<locale>/ui.json` (`ui::tree_select.*`, `ui::mention_input.*`).
 * Boundary: internal: the web and native components import it by path. Kept apart from `UI_KEYS` so wave C lands
 *           without editing the shared key list; it folds into `UI_KEYS` when that is next touched.
 * Runtime: isomorphic
 * Governing contract: ADR 0080 (typed i18n keys); ADR 0231 (`<module>::<path>`); ADR 0403 (seven languages).
 */
import { keys } from "@stackra/i18n";

/** The TreeSelect's and MentionInput's keys. */
export const INPUT_KEYS = keys({
  ui: {
    tree_select: ["placeholder", "count"],
    mention_input: ["people"],
  },
});
