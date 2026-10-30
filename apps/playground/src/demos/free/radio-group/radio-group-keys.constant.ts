/**
 * Stackra file contract:
 * Purpose: `RADIO_GROUP_KEYS`, the typed keys of the web Radio group demos' words in `assets/lang/<locale>/radio_group.json`.
 * Boundary: keys only; the words live in the catalogues. A stand-in for the `#stackra/i18n` keys gen writes (STA-339).
 * Runtime: browser
 * Governing contract: ADR 0080 (typed i18n keys); ADR 0231 (`<module>::<path>`); ADR 0305 (catalogue layout).
 */
import { keys } from "@stackra/i18n";

/** The radio_group namespace's keys. */
export const RADIO_GROUP_KEYS = keys({
  radio_group: {
    _: [
      "vertical_description",
      "invalid_description",
      "invalid_error",
      "chosen",
      "pick_apple",
      "pick_pear",
    ],
    captions: ["disabled", "option_disabled", "read_only", "required", "invalid"],
    group_labels: [
      "vertical",
      "horizontal",
      "disabled",
      "option_disabled",
      "read_only",
      "required",
      "invalid",
      "live",
      "primary",
      "secondary",
    ],
    sample: [
      "standard",
      "delivered_in_5_to_7",
      "express",
      "delivered_in_2_to_3",
      "overnight",
      "small",
      "medium",
      "large",
      "apple",
      "pear",
      "plum",
      "monthly",
      "yearly",
      "card",
      "bank_transfer",
      "cheque",
    ],
  },
});
