/**
 * Stackra file contract:
 * Purpose: `CHECKBOX_GROUP_KEYS`, the typed keys of the web Checkbox group demos' words in `assets/lang/<locale>/checkbox_group.json`.
 * Boundary: keys only; the words live in the catalogues. A stand-in for the `#stackra/i18n` keys gen writes (STA-339).
 * Runtime: browser
 * Governing contract: ADR 0080 (typed i18n keys); ADR 0231 (`<module>::<path>`); ADR 0305 (catalogue layout).
 */
import { keys } from "@stackra/i18n";

/** The checkbox_group namespace's keys. */
export const CHECKBOX_GROUP_KEYS = keys({
  checkbox_group: {
    _: [
      "basic_description",
      "invalid_description",
      "invalid_error",
      "chosen",
      "none",
      "all",
      "clear",
    ],
    captions: ["disabled", "option_disabled", "read_only", "required", "invalid"],
    group_labels: [
      "basic",
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
      "email",
      "a_weekly_digest",
      "text_message",
      "push_notification",
      "cheese",
      "olives",
      "basil",
      "chilli",
      "csv",
      "excel",
      "pdf",
      "monday",
      "thursday",
    ],
  },
});
