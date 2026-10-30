/**
 * Stackra file contract:
 * Purpose: `DATE_LABEL_KEYS`, the typed keys of the web DateLabel demos' words in `assets/lang/<locale>/date_label.json`.
 * Boundary: keys only; the words live in the catalogues. A stand-in for the `#stackra/i18n` keys gen writes (STA-339).
 * Runtime: browser
 * Governing contract: ADR 0080 (typed i18n keys); ADR 0231 (`<module>::<path>`); ADR 0305 (catalogue layout).
 */
import { keys } from "@stackra/i18n";

/** The date_label namespace's keys. */
export const DATE_LABEL_KEYS = keys({
  date_label: {
    _: [
      "created",
      "invoice_due",
      "invoice_due_soon",
      "invoice_far",
      "batch_expired",
      "batch_expiring",
      "invoices",
      "invoice",
      "gregorian",
      "hijri",
      "promotion_ends",
      "earlier",
      "later",
      "due_date",
    ],
  },
});
