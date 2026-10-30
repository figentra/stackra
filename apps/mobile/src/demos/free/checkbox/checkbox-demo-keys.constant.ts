/**
 * Stackra file contract:
 * Purpose: `CHECKBOX_DEMO_KEYS`, the typed keys of the native checkbox demos' words in `assets/lang/<locale>/demo_free.json`.
 * Boundary: keys only; the words live in the catalogues. A stand-in for the `#stackra/i18n` keys gen writes (STA-339).
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0080 (typed i18n keys).
 */
import { keys } from "@stackra/i18n";

/** The checkbox demos' keys. */
export const CHECKBOX_DEMO_KEYS = keys({
  demo_free: {
    checkbox: {
      states: [
        "unchecked",
        "checked",
        "indeterminate",
        "disabled",
        "disabled_checked",
        "read_only",
        "required",
        "described",
        "description_text",
        "invalid",
        "error_text",
      ],
      variants: ["primary", "secondary"],
      unnamed: ["row_selector"],
      live: ["parent", "cheese", "olives", "basil", "chosen", "none", "clear"],
    },
  },
});
