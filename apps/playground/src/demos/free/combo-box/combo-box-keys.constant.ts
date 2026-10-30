/**
 * Stackra file contract:
 * Purpose: `COMBO_BOX_KEYS`, the typed keys of the web Combo box demos' words in `assets/lang/<locale>/combo_box.json`.
 * Boundary: keys only; the words live in the catalogues. A stand-in for the `#stackra/i18n` keys gen writes (STA-339).
 * Runtime: browser
 * Governing contract: ADR 0080 (typed i18n keys); ADR 0231 (`<module>::<path>`); ADR 0305 (catalogue layout).
 */
import { keys } from "@stackra/i18n";

/** The combo_box namespace's keys. */
export const COMBO_BOX_KEYS = keys({
  combo_box: {
    _: [
      "country_label",
      "country_placeholder",
      "described_label",
      "described_placeholder",
      "description",
      "hidden_label_name",
      "single",
      "multiple",
      "rich_label",
      "rich_placeholder",
      "required",
      "invalid",
      "invalid_error",
      "disabled",
      "read_only",
      "no_match",
      "no_match_message",
      "full_width",
      "full_width_note",
      "live_label",
      "live_loading",
      "chosen",
      "shown",
    ],
    sample: [
      "argentina",
      "andorra",
      "australia",
      "austria",
      "belgium",
      "brazil",
      "canada",
      "chile",
      "czechia",
      "denmark",
      "egypt",
      "finland",
      "france",
      "germany",
      "greece",
      "india",
      "italy",
      "japan",
      "kenya",
      "mexico",
      "netherlands",
      "norway",
      "spain",
      "sweden",
      "cairo",
      "engineering_and_support",
      "berlin",
      "sales_for_europe",
      "london",
      "head_office",
      "new_york",
      "sales_for_the_americas",
      "lisbon",
      "closed_in_2024",
    ],
  },
});
