/**
 * Stackra file contract:
 * Purpose: `SWITCH_KEYS`, the typed keys of the web Switch demos' words in `assets/lang/<locale>/switch.json`.
 * Boundary: keys only; the words live in the catalogues. A stand-in for the `#stackra/i18n` keys gen writes (STA-339).
 * Runtime: browser
 * Governing contract: ADR 0080 (typed i18n keys); ADR 0231 (`<module>::<path>`); ADR 0305 (catalogue layout).
 */
import { keys } from "@stackra/i18n";

/** The switch namespace's keys. */
export const SWITCH_KEYS = keys({
  switch: {
    _: ["description_text", "error_text", "unnamed_name", "settings", "summary", "none"],
    captions: [
      "off",
      "on",
      "disabled",
      "disabled_on",
      "read_only",
      "required",
      "description",
      "invalid",
    ],
    labels: [
      "off",
      "on",
      "disabled",
      "disabled_on",
      "read_only",
      "required",
      "description",
      "invalid",
    ],
    sample: ["sync_over_mobile_data", "dark_theme", "beta_features"],
  },
});
