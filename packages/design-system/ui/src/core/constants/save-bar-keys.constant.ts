/**
 * Stackra file contract:
 * Purpose: `SAVE_BAR_KEYS`, the typed keys of SaveBar's and SaveStatus's own words in `assets/lang/<locale>/ui.json`
 *          (`ui::save_bar.*`): the message, the two buttons and the three autosave states.
 * Boundary: internal: the web and native SaveBar and SaveStatus import it by path; no entry exports it. Kept beside
 *           `UI_KEYS` until the two are folded together, so parallel builds never edit one shared file.
 * Runtime: isomorphic
 * Governing contract: ADR 0080 (typed i18n keys); ADR 0231 (`<module>::<path>`); ADR 0403 (seven languages).
 */
import { keys } from "@stackra/i18n";

/** SaveBar's and SaveStatus's keys. */
export const SAVE_BAR_KEYS = keys({
  ui: { save_bar: ["label", "message", "save", "discard", "saving", "saved", "failed"] },
});
