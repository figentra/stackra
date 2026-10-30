/**
 * Stackra file contract:
 * Purpose: `PROGRESS_CIRCLE_DEMO_KEYS`, the typed keys of the native progress-circle demos' words in `assets/lang/<locale>/demo_free.json`.
 * Boundary: keys only; the words live in the catalogues. A stand-in for the `#stackra/i18n` keys gen writes (STA-339).
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0080 (typed i18n keys).
 */
import { keys } from "@stackra/i18n";

/** The progress-circle demos' keys. */
export const PROGRESS_CIRCLE_DEMO_KEYS = keys({
  demo_free: {
    progress_circle: {
      indeterminate: ["caption", "label"],
      live: ["label", "less", "more", "readout", "reset"],
      sizes: ["label"],
      spoken: ["caption", "label", "value_label"],
      tones: ["label"],
      values: ["caption", "label"],
    },
  },
});
