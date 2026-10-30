/**
 * Stackra file contract:
 * Purpose: `USE_CONFIRMATION_DEMO_KEYS`, the typed keys of the native use-confirmation demos' words in `assets/lang/<locale>/demo_free.json`.
 * Boundary: keys only; the words live in the catalogues. A stand-in for the `#stackra/i18n` keys gen writes (STA-339).
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0080 (typed i18n keys).
 */
import { keys } from "@stackra/i18n";

/** The use-confirmation demos' keys. */
export const USE_CONFIRMATION_DEMO_KEYS = keys({
  demo_free: {
    use_confirmation: {
      basics: ["open", "question", "body", "confirm", "cancel"],
      danger: ["open", "question", "body", "confirm", "cancel"],
      bell: ["open", "question", "body", "confirm", "cancel"],
      typed: ["open", "question", "body", "field", "confirm", "cancel"],
      live: ["answered", "yes", "no", "none"],
    },
  },
});
