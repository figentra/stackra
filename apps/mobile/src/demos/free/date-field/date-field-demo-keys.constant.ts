/**
 * Stackra file contract:
 * Purpose: `DATE_FIELD_DEMO_KEYS`, the typed keys of the native date-field demos' words in `assets/lang/<locale>/demo_free.json`.
 * Boundary: keys only; the words live in the catalogues. A stand-in for the `#stackra/i18n` keys gen writes (STA-339).
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0080 (typed i18n keys).
 */
import { keys } from "@stackra/i18n";

/** The date-field demos' keys. */
export const DATE_FIELD_DEMO_KEYS = keys({
  demo_free: {
    date_field: {
      basics: ["empty", "empty_hint", "filled"],
      bounded: ["label", "hint"],
      unavailable: ["label", "hint"],
      states: ["required", "invalid", "invalid_error", "disabled", "read_only"],
      live: ["label", "chosen", "none", "next", "clear"],
    },
  },
});
