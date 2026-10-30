/**
 * Stackra file contract:
 * Purpose: `SINGLE_COLUMN_LAYOUT_KEYS`, the typed keys of the web Single column layout demos' words in `assets/lang/<locale>/single_column_layout.json`.
 * Boundary: keys only; the words live in the catalogues. A stand-in for the `#stackra/i18n` keys gen writes (STA-339).
 * Runtime: browser
 * Governing contract: ADR 0080 (typed i18n keys); ADR 0231 (`<module>::<path>`); ADR 0305 (catalogue layout).
 */
import { keys } from "@stackra/i18n";

/** The single_column_layout namespace's keys. */
export const SINGLE_COLUMN_LAYOUT_KEYS = keys({
  single_column_layout: [
    "stacked_caption",
    "wide_caption",
    "scroller",
    "customer",
    "customer_body",
    "payment",
    "payment_body",
    "shipping",
    "shipping_body",
    "items_title",
    "items_row",
    "arabic_customer",
    "arabic_customer_body",
    "arabic_payment",
    "arabic_payment_body",
    "add",
    "remove",
    "note",
    "note_body",
    "count",
  ],
});
