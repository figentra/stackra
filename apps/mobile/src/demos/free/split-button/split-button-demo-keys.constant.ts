/**
 * Stackra file contract:
 * Purpose: `SPLIT_BUTTON_DEMO_KEYS`, the typed keys of the native Split button demos' words in `assets/lang/<locale>/demo_free.json`.
 * Boundary: keys only; the words live in the catalogues. A stand-in for the `#stackra/i18n` keys gen writes (STA-339).
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0080 (typed i18n keys).
 */
import { keys } from "@stackra/i18n";

/** The split_button demos' keys. */
export const SPLIT_BUTTON_DEMO_KEYS = keys({
  demo_free: {
    split_button: {
      sample: [
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
    },
  },
});
