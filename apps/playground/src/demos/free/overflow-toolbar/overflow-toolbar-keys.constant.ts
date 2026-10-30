/**
 * Stackra file contract:
 * Purpose: `OVERFLOW_TOOLBAR_KEYS`, the typed keys of the web Overflow toolbar demos' words in `assets/lang/<locale>/overflow_toolbar.json`.
 * Boundary: keys only; the words live in the catalogues. A stand-in for the `#stackra/i18n` keys gen writes (STA-339).
 * Runtime: browser
 * Governing contract: ADR 0080 (typed i18n keys); ADR 0231 (`<module>::<path>`); ADR 0305 (catalogue layout).
 */
import { keys } from "@stackra/i18n";

/** The overflow_toolbar namespace's keys. */
export const OVERFLOW_TOOLBAR_KEYS = keys({
  overflow_toolbar: [
    "label",
    "more",
    "refund",
    "print_receipt",
    "email_receipt",
    "split_bill",
    "void",
    "chosen",
    "nothing_chosen",
    "narrower",
    "wider",
  ],
});
