/**
 * Stackra file contract:
 * Purpose: `INLINE_LOADING_KEYS`, the typed keys of InlineLoading's own words in `assets/lang/<locale>/ui.json`
 *          (`ui::inline_loading.*`): the loading, success and error texts.
 * Boundary: internal: the web and native InlineLoading import it by path; no entry exports it. Kept beside `UI_KEYS`
 *           until the two are folded together, so parallel builds never edit one shared file.
 * Runtime: isomorphic
 * Governing contract: ADR 0080 (typed i18n keys); ADR 0231 (`<module>::<path>`); ADR 0403 (seven languages).
 */
import { keys } from "@stackra/i18n";

/** The catalogue keys for the InlineLoading words. */
export const INLINE_LOADING_KEYS = keys({
  ui: { inline_loading: ["loading", "success", "error"] },
});
