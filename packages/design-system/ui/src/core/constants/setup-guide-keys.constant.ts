/**
 * Stackra file contract:
 * Purpose: `SETUP_GUIDE_KEYS`, the typed keys of SetupGuide's own words in `assets/lang/<locale>/ui.json`
 *          (`ui::setup_guide.*`): the progress sentence, the done text and the show/hide button.
 * Boundary: internal: the web and native SetupGuide import it by path; no entry exports it. Kept beside `UI_KEYS`
 *           until the two are folded together, so parallel builds never edit one shared file.
 * Runtime: isomorphic
 * Governing contract: ADR 0080 (typed i18n keys); ADR 0231 (`<module>::<path>`); ADR 0403 (seven languages).
 */
import { keys } from "@stackra/i18n";

/** The catalogue keys for the SetupGuide words. */
export const SETUP_GUIDE_KEYS = keys({
  ui: { setup_guide: ["progress", "complete", "show", "hide"] },
});
