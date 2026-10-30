/**
 * Stackra file contract:
 * Purpose: `SYSTEM_BANNER_DEMO_KEYS`, the typed keys of the native system-banner demos' words in `assets/lang/<locale>/demo_free.json`.
 * Boundary: keys only; the words live in the catalogues. A stand-in for the `#stackra/i18n` keys gen writes (STA-339).
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); gap inventory row 27; ADR 0080 (typed i18n keys).
 */
import { keys } from "@stackra/i18n";

/** The system-banner demos' keys. */
export const SYSTEM_BANNER_DEMO_KEYS = keys({
  demo_free: {
    system_banner: [
      "outage_title",
      "outage_detail",
      "trial_title",
      "trial_detail",
      "compliance_title",
      "compliance_detail",
      "choose_plan",
      "status_page",
      "link_vat",
      "show_again",
      "dismissed",
    ],
  },
});
