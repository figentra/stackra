/**
 * Stackra file contract:
 * Purpose: `APP_HEADER_KEYS`, the typed keys of the web App header demos' words in `assets/lang/<locale>/app_header.json`.
 * Boundary: keys only; the words live in the catalogues. A stand-in for the `#stackra/i18n` keys gen writes (STA-339).
 * Runtime: browser
 * Governing contract: ADR 0080 (typed i18n keys); ADR 0231 (`<module>::<path>`); ADR 0305 (catalogue layout).
 */
import { keys } from "@stackra/i18n";

/** The app_header namespace's keys. */
export const APP_HEADER_KEYS = keys({
  app_header: {
    _: [
      "all",
      "title_only",
      "logo",
      "no_actions",
      "long",
      "long_title",
      "brand",
      "open_navigation",
      "search_label",
      "search_placeholder",
      "notifications",
      "account_label",
      "profile",
      "settings",
      "sign_out",
      "search_status",
      "unread_status",
      "action_status",
      "arabic_brand",
      "arabic_open_navigation",
      "arabic_search_label",
      "arabic_notifications",
      "arabic_account_label",
      "arabic_profile",
      "arabic_sign_out",
    ],
    sample: ["account", "session"],
  },
});
