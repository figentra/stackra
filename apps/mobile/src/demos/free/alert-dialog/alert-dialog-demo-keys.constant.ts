/**
 * Stackra file contract:
 * Purpose: `ALERT_DIALOG_DEMO_KEYS`, the typed keys of the native alert-dialog demos' words in `assets/lang/<locale>/demo_free.json`.
 * Boundary: keys only; the words live in the catalogues. A stand-in for the `#stackra/i18n` keys gen writes (STA-339).
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0080 (typed i18n keys).
 */
import { keys } from "@stackra/i18n";

/** The alert-dialog demos' keys. */
export const ALERT_DIALOG_DEMO_KEYS = keys({
  demo_free: {
    alert_dialog: {
      basics: ["open", "question", "body", "confirm", "cancel"],
      danger: ["open", "question", "body", "confirm", "cancel"],
      dismissable: ["open", "question", "body", "confirm", "cancel"],
      icons: ["custom", "custom_question", "none", "none_question", "confirm", "cancel"],
      typed: ["open", "question", "body", "field", "confirm", "cancel"],
      live: ["open", "question", "confirm", "cancel", "confirmed", "refused", "none"],
    },
  },
});
