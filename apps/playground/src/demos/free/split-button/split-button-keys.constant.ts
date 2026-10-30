/**
 * Stackra file contract:
 * Purpose: `SPLIT_BUTTON_KEYS`, the typed keys of the web Split button demos' words in `assets/lang/<locale>/split_button.json`.
 * Boundary: keys only; the words live in the catalogues. A stand-in for the `#stackra/i18n` keys gen writes (STA-339).
 * Runtime: browser
 * Governing contract: ADR 0080 (typed i18n keys); ADR 0231 (`<module>::<path>`); ADR 0305 (catalogue layout).
 */
import { keys } from "@stackra/i18n";

/** The split_button namespace's keys. */
export const SPLIT_BUTTON_KEYS = keys({
  split_button: [
    "save",
    "more_save_options",
    "save_options",
    "save_new",
    "save_draft",
    "discard",
    "chosen",
    "nothing_chosen",
    "charge",
    "more_charge_options",
    "charge_options",
    "split_bill",
    "pay_later",
    "print",
    "more_print_options",
    "print_options",
    "gift_receipt",
    "email_receipt",
    "disabled",
    "start_saving",
    "stop_saving",
  ],
});
