/**
 * Stackra file contract:
 * Purpose: `OVERFLOW_TOOLBAR_DEMO_KEYS`, the typed keys of the native Overflow toolbar demos' words in `assets/lang/<locale>/demo_free.json`.
 * Boundary: keys only; the words live in the catalogues. A stand-in for the `#stackra/i18n` keys gen writes (STA-339).
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0080 (typed i18n keys).
 */
import { keys } from "@stackra/i18n";

/** The overflow_toolbar demos' keys. */
export const OVERFLOW_TOOLBAR_DEMO_KEYS = keys({
  demo_free: {
    overflow_toolbar: {
      sample: [
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
    },
  },
});
