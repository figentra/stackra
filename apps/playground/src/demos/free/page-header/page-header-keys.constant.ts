/**
 * Stackra file contract:
 * Purpose: `PAGE_HEADER_KEYS`, the typed keys of the web Page header demos' words in `assets/lang/<locale>/page_header.json`.
 * Boundary: keys only; the words live in the catalogues. A stand-in for the `#stackra/i18n` keys gen writes (STA-339).
 * Runtime: browser
 * Governing contract: ADR 0080 (typed i18n keys); ADR 0231 (`<module>::<path>`); ADR 0305 (catalogue layout).
 */
import { keys } from "@stackra/i18n";

/** The page_header namespace's keys. */
export const PAGE_HEADER_KEYS = keys({
  page_header: [
    "title_only",
    "description",
    "status",
    "start",
    "every",
    "one",
    "three",
    "six",
    "danger",
    "link",
    "order",
    "placed",
    "paid",
    "shipped",
    "create",
    "edit",
    "export",
    "duplicate",
    "print",
    "archive",
    "delete",
    "open_app",
    "mark_shipped",
    "undo_shipping",
    "more_actions",
    "orders",
    "customers",
    "action_status",
    "arabic_title",
    "arabic_description",
    "arabic_paid",
    "arabic_edit",
    "arabic_export",
  ],
});
