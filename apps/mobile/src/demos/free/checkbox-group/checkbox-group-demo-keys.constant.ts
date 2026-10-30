/**
 * Stackra file contract:
 * Purpose: `CHECKBOX_GROUP_DEMO_KEYS`, the typed keys of the native checkbox-group demos' words in `assets/lang/<locale>/demo_free.json`.
 * Boundary: keys only; the words live in the catalogues. A stand-in for the `#stackra/i18n` keys gen writes (STA-339).
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0080 (typed i18n keys).
 */
import { keys } from "@stackra/i18n";

/** The checkbox-group demos' keys. */
export const CHECKBOX_GROUP_DEMO_KEYS = keys({
  demo_free: {
    checkbox_group: {
      channels: ["email", "sms", "sms_note", "push"],
      days: ["mon", "wed", "fri"],
      basic: ["label", "hint"],
      states: [
        "disabled",
        "option_disabled",
        "read_only",
        "required",
        "invalid",
        "invalid_hint",
        "invalid_error",
      ],
      variants: ["primary", "secondary"],
      live: ["label", "cheese", "olives", "basil", "chosen", "none", "all", "clear"],
    },
  },
});
