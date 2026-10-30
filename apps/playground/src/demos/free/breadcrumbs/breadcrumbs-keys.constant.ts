/**
 * Stackra file contract:
 * Purpose: `BREADCRUMBS_KEYS`, the typed keys of the web Breadcrumbs demos' words in `assets/lang/<locale>/breadcrumbs.json`.
 * Boundary: keys only; the words live in the catalogues. A stand-in for the `#stackra/i18n` keys gen writes (STA-339).
 * Runtime: browser
 * Governing contract: ADR 0080 (typed i18n keys); ADR 0231 (`<module>::<path>`); ADR 0305 (catalogue layout).
 */
import { keys } from "@stackra/i18n";

/** The breadcrumbs namespace's keys. */
export const BREADCRUMBS_KEYS = keys({
  breadcrumbs: [
    "trail_label",
    "home",
    "orders",
    "order",
    "invoice",
    "single_label",
    "long_label",
    "settings",
    "team",
    "roles",
    "editor",
    "separator_label",
    "press_only_label",
    "press_count",
    "live_label",
    "deeper",
    "reset",
    "current",
    "arabic_label",
    "arabic_home",
    "arabic_orders",
    "arabic_order",
  ],
});
