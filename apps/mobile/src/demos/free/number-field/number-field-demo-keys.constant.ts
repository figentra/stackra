/**
 * Stackra file contract:
 * Purpose: `NUMBER_FIELD_DEMO_KEYS`, the typed keys of the native number-field demos' words in `assets/lang/<locale>/demo_free.json`.
 * Boundary: keys only; the words live in the catalogues. A stand-in for the `#stackra/i18n` keys gen writes (STA-339).
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0080 (typed i18n keys).
 */
import { keys } from "@stackra/i18n";

/** The number-field demos' keys. */
export const NUMBER_FIELD_DEMO_KEYS = keys({
  demo_free: {
    number_field: {
      basics: ["hint", "placeholder", "quantity", "weight"],
      bounded: ["decrement", "hint", "increment", "label"],
      formats: ["currency", "currency_hint", "percent", "percent_hint"],
      live: ["clear", "label", "none", "set", "value"],
      states: ["disabled", "invalid", "invalid_error", "read_only", "required"],
      steppers: ["label"],
    },
  },
});
