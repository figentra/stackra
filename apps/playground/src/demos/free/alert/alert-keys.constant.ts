/**
 * Stackra file contract:
 * Purpose: `ALERT_KEYS`, the typed keys of the web Alert demos' words in `assets/lang/<locale>/alert.json`.
 * Boundary: keys only; the words live in the catalogues. A stand-in for the `#stackra/i18n` keys gen writes (STA-339).
 * Runtime: browser
 * Governing contract: ADR 0080 (typed i18n keys); ADR 0231 (`<module>::<path>`); ADR 0305 (catalogue layout).
 */
import { keys } from "@stackra/i18n";

/** The alert namespace's keys. */
export const ALERT_KEYS = keys({
  alert: {
    _: ["show_error", "show_saved", "retry", "dismiss", "upgrade", "manage"],
    sample: [
      "your_trial_is_active",
      "you_have_14_days_left",
      "a_new_version_is_available",
      "reload_the_page_to_get",
      "changes_saved",
      "your_profile_is_up_to",
      "storage_is_almost_full",
      "delete_files_or_upgrade_to",
      "payment_failed",
      "your_card_was_declined_check",
      "title_only",
      "with_actions",
      "an_icon_of_your_own",
      "no_icon",
    ],
  },
});
