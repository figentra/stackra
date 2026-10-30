/**
 * Stackra file contract:
 * Purpose: `ERROR_PAGE_KEYS`, the typed keys of the web ErrorPage demos' words in `assets/lang/<locale>/error_page.json`.
 * Boundary: keys only; the words live in the catalogues. A stand-in for the `#stackra/i18n` keys gen writes (STA-339).
 * Runtime: browser
 * Governing contract: ADR 0080 (typed i18n keys); ADR 0231 (`<module>::<path>`); ADR 0305 (catalogue layout).
 */
import { keys } from "@stackra/i18n";

/** The error_page namespace's keys. */
export const ERROR_PAGE_KEYS = keys({
  error_page: {
    _: ["region_name", "preset_label", "home", "recovered", "break_again", "attempts"],
    presets: ["forbidden", "not_found", "server_error", "offline"],
    custom: ["title", "description", "back_to_orders", "contact_manager"],
  },
});
