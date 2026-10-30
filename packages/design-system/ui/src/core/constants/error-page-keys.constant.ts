/**
 * Stackra file contract:
 * Purpose: `ERROR_PAGE_KEYS`, the typed keys of the ErrorPage's own words in `assets/lang/<locale>/ui.json` (`ui::error_page.*`).
 * Boundary: internal: the web and native components import it by path. Kept apart from `UI_KEYS` so the gap
 *           components land without editing the shared key list; it folds into `UI_KEYS` when that is next touched.
 * Runtime: isomorphic
 * Governing contract: ADR 0080 (typed i18n keys); ADR 0231 (`<module>::<path>`); ADR 0403 (seven languages).
 */
import { keys } from "@stackra/i18n";

/** The ErrorPage's keys. */
export const ERROR_PAGE_KEYS = keys({
  ui: {
    error_page: {
      _: ["retry"],
      forbidden: ["title", "description"],
      not_found: ["title", "description"],
      server_error: ["title", "description"],
      offline: ["title", "description"],
    },
  },
});
