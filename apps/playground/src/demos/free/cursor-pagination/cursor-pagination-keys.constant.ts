/**
 * Stackra file contract:
 * Purpose: `CURSOR_PAGINATION_KEYS`, the typed keys of the web Cursor pagination demos' words in `assets/lang/<locale>/cursor_pagination.json`.
 * Boundary: keys only; the words live in the catalogues. A stand-in for the `#stackra/i18n` keys gen writes (STA-339).
 * Runtime: browser
 * Governing contract: ADR 0080 (typed i18n keys); ADR 0231 (`<module>::<path>`); ADR 0305 (catalogue layout).
 */
import { keys } from "@stackra/i18n";

/** The cursor_pagination namespace's keys. */
export const CURSOR_PAGINATION_KEYS = keys({
  cursor_pagination: [
    "first",
    "middle",
    "last",
    "only",
    "loading",
    "more",
    "loading_more",
    "end",
    "size",
    "default_count",
    "custom_count",
    "custom_sentence",
    "pager_label",
    "growing_label",
    "orders_page",
    "orders_growing",
    "cursor",
    "order",
    "pager_example",
    "growing_example",
  ],
});
