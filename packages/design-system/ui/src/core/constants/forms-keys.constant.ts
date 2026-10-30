/**
 * Stackra file contract:
 * Purpose: `FORMS_KEYS`, the typed keys of the wave 3a form and picker components' own words in
 *          `assets/lang/<locale>/ui.json` (`ui::wheel.*`, `ui::date_range_picker.*`, `ui::emoji_picker.*`, ...).
 * Boundary: keys only; internal. Kept beside `UI_KEYS` so parallel builds never edit that file; fold it in later.
 * Runtime: isomorphic
 * Governing contract: ADR 0080 (typed i18n keys); ADR 0231 (`<module>::<path>`); ADR 0403 (seven languages).
 */
import { keys } from "@stackra/i18n";

/** The form and picker components' keys. */
export const FORMS_KEYS = keys({
  ui: {
    wheel: ["day", "month", "year", "hour", "minute", "period"],
    time_picker: ["open"],
    date_time_picker: ["date", "time"],
    date_range_picker: [
      "calendar",
      "presets",
      "today",
      "yesterday",
      "last_7_days",
      "last_30_days",
      "last_90_days",
      "this_month",
      "last_month",
      "this_quarter",
      "last_quarter",
      "this_year",
      "last_12_months",
    ],
    year_picker: ["label"],
    range_calendar: ["previous", "next"],
    emoji_picker: [
      "label",
      "search",
      "recent",
      "no_matches",
      "smileys",
      "people",
      "nature",
      "food",
      "activities",
      "travel",
      "objects",
      "symbols",
    ],
    reaction_button: ["label"],
    otp_input: ["label", "digit"],
    phone_field: ["country", "number", "empty", "selected", "close"],
    country_select: ["label", "search"],
    address_field: ["line1", "line2", "city", "region", "postal_code", "country"],
    drop_zone: ["label", "browse", "label_one", "browse_one", "paste_hint", "taken"],
    color_picker: ["label", "hex", "hue", "swatches"],
    locale_switcher: ["label"],
  },
});
