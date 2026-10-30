/**
 * Stackra file contract:
 * Purpose: `NAVIGATION_HEADER_KEYS`, the typed keys of the web Navigation header demos' words in `assets/lang/<locale>/navigation_header.json`.
 * Boundary: keys only; the words live in the catalogues. A stand-in for the `#stackra/i18n` keys gen writes (STA-339).
 * Runtime: browser
 * Governing contract: ADR 0080 (typed i18n keys); ADR 0231 (`<module>::<path>`); ADR 0305 (catalogue layout).
 */
import { keys } from "@stackra/i18n";

/** The navigation_header namespace's keys. */
export const NAVIGATION_HEADER_KEYS = keys({
  navigation_header: [
    "title_only",
    "back_button",
    "back_link",
    "slots",
    "long",
    "long_title",
    "large",
    "title",
    "order_title",
    "back_home",
    "notifications",
    "add",
    "large_switch",
    "back_status",
    "action_status",
    "title_status",
    "arabic_title",
    "arabic_back",
    "arabic_notifications",
  ],
});
