/**
 * Stackra file contract:
 * Purpose: `ALERT_DIALOG_KEYS`, the typed keys of the web Alert dialog demos' words in `assets/lang/<locale>/alert_dialog.json`.
 * Boundary: keys only; the words live in the catalogues. A stand-in for the `#stackra/i18n` keys gen writes (STA-339).
 * Runtime: browser
 * Governing contract: ADR 0080 (typed i18n keys); ADR 0231 (`<module>::<path>`); ADR 0305 (catalogue layout).
 */
import { keys } from "@stackra/i18n";

/** The alert_dialog namespace's keys. */
export const ALERT_DIALOG_KEYS = keys({
  alert_dialog: {
    _: ["no_answer", "confirmed", "cancelled"],
    samples: {
      default: ["trigger", "title", "description", "confirm", "cancel"],
      accent: ["trigger", "title", "description", "confirm", "cancel"],
      success: ["trigger", "title", "description", "confirm", "cancel"],
      warning: ["trigger", "title", "description", "confirm", "cancel"],
      danger: ["trigger", "title", "description", "confirm", "cancel"],
      custom_icon: ["trigger", "title", "description", "confirm", "cancel"],
      no_icon: ["trigger", "title", "description", "confirm", "cancel"],
      dismissable: ["trigger", "title", "description", "confirm", "cancel"],
      no_escape: ["trigger", "title", "description", "confirm", "cancel"],
    },
  },
});
