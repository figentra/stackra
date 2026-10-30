/**
 * Stackra file contract:
 * Purpose: `ALERT_DEMO_KEYS`, the typed keys of the native alert demos' words in `assets/lang/<locale>/demo_free.json`.
 * Boundary: keys only; the words live in the catalogues. A stand-in for the `#stackra/i18n` keys gen writes (STA-339).
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0080 (typed i18n keys).
 */
import { keys } from "@stackra/i18n";

/** The alert demos' keys. */
export const ALERT_DEMO_KEYS = keys({
  demo_free: {
    alert: {
      tones: ["alert_title", "alert_description"],
      plain: ["alert_title"],
      icons: ["custom", "none"],
      actions: ["alert_title", "alert_description", "retry", "contact"],
      live: ["alert_title", "alert_description", "dismiss", "show_again", "hidden"],
    },
  },
});
