/**
 * Stackra file contract:
 * Purpose: `CHECKBOX_KEYS`, the typed keys of the web Checkbox demos' words in `assets/lang/<locale>/checkbox.json`.
 * Boundary: keys only; the words live in the catalogues. A stand-in for the `#stackra/i18n` keys gen writes (STA-339).
 * Runtime: browser
 * Governing contract: ADR 0080 (typed i18n keys); ADR 0231 (`<module>::<path>`); ADR 0305 (catalogue layout).
 */
import { keys } from "@stackra/i18n";

/** The checkbox namespace's keys. */
export const CHECKBOX_KEYS = keys({
  checkbox: {
    _: [
      "description_text",
      "error_text",
      "primary",
      "secondary",
      "row_selector",
      "parent",
      "children",
      "chosen",
      "none",
      "clear",
    ],
    captions: [
      "unchecked",
      "checked",
      "indeterminate",
      "disabled",
      "disabled_checked",
      "read_only",
      "required",
      "description",
      "invalid",
    ],
    labels: [
      "unchecked",
      "checked",
      "indeterminate",
      "disabled",
      "disabled_checked",
      "read_only",
      "required",
      "description",
      "invalid",
    ],
    sample: [
      "cheese",
      "olives",
      "basil",
      "primary_unchecked",
      "primary_checked",
      "secondary_unchecked",
      "secondary_checked",
    ],
  },
});
