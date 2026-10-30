/**
 * Stackra file contract:
 * Purpose: `TWO_COLUMN_LAYOUT_KEYS`, the typed keys of the web Two column layout demos' words in `assets/lang/<locale>/two_column_layout.json`.
 * Boundary: keys only; the words live in the catalogues. A stand-in for the `#stackra/i18n` keys gen writes (STA-339).
 * Runtime: browser
 * Governing contract: ADR 0080 (typed i18n keys); ADR 0231 (`<module>::<path>`); ADR 0305 (catalogue layout).
 */
import { keys } from "@stackra/i18n";

/** The two_column_layout namespace's keys. */
export const TWO_COLUMN_LAYOUT_KEYS = keys({
  two_column_layout: [
    "default_caption",
    "md_caption",
    "xl_caption",
    "history_switch",
    "order",
    "order_body",
    "items",
    "items_body",
    "summary",
    "summary_body",
    "history",
    "history_body",
    "md_main",
    "md_aside",
    "xl_main",
    "xl_aside",
    "live_main",
    "live_summary",
    "live_history",
    "main_body",
    "aside_body",
    "arabic_main",
    "arabic_main_body",
    "arabic_aside",
    "arabic_aside_body",
    "history_status",
  ],
});
