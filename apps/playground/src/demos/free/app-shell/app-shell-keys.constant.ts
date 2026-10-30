/**
 * Stackra file contract:
 * Purpose: `APP_SHELL_KEYS`, the typed keys of the web App shell demos' words in `assets/lang/<locale>/app_shell.json`.
 * Boundary: keys only; the words live in the catalogues. A stand-in for the `#stackra/i18n` keys gen writes (STA-339).
 * Runtime: browser
 * Governing contract: ADR 0080 (typed i18n keys); ADR 0231 (`<module>::<path>`); ADR 0305 (catalogue layout).
 */
import { keys } from "@stackra/i18n";

/** The app_shell namespace's keys. */
export const APP_SHELL_KEYS = keys({
  app_shell: [
    "frame_label",
    "breakpoint_label",
    "arabic_label",
    "live_label",
    "state",
    "open_navigation",
    "brand",
    "heading",
    "body",
    "heading_bare",
    "home",
    "orders",
    "customers",
    "inbox",
    "arabic_brand",
    "arabic_heading",
    "arabic_body",
    "arabic_home",
    "arabic_orders",
    "arabic_customers",
  ],
});
