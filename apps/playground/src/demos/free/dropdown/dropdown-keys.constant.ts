/**
 * Stackra file contract:
 * Purpose: `DROPDOWN_KEYS`, the typed keys of the web Dropdown demos' words in `assets/lang/<locale>/dropdown.json`.
 * Boundary: keys only; the words live in the catalogues. A stand-in for the `#stackra/i18n` keys gen writes (STA-339).
 * Runtime: browser
 * Governing contract: ADR 0080 (typed i18n keys); ADR 0231 (`<module>::<path>`); ADR 0305 (catalogue layout).
 */
import { keys } from "@stackra/i18n";

/** The dropdown namespace's keys. */
export const DROPDOWN_KEYS = keys({
  dropdown: [
    "account",
    "account_menu",
    "profile",
    "profile_hint",
    "billing",
    "billing_hint",
    "sign_out",
    "chosen",
    "nothing_chosen",
    "language",
    "languages",
    "english",
    "arabic",
    "french",
    "current",
  ],
});
