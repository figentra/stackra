/**
 * Stackra file contract:
 * Purpose: `TAG_GROUP_KEYS`, the typed keys of the web Tag group demos' words in `assets/lang/<locale>/tag_group.json`.
 * Boundary: keys only; the words live in the catalogues. A stand-in for the `#stackra/i18n` keys gen writes (STA-339).
 * Runtime: browser
 * Governing contract: ADR 0080 (typed i18n keys); ADR 0231 (`<module>::<path>`); ADR 0305 (catalogue layout).
 */
import { keys } from "@stackra/i18n";

/** The tag_group namespace's keys. */
export const TAG_GROUP_KEYS = keys({
  tag_group: {
    _: [
      "topics_label",
      "described_label",
      "description",
      "hidden_label_name",
      "size",
      "none",
      "single",
      "multiple",
      "disabled_tag",
      "disabled_group",
      "read_only",
      "required",
      "invalid",
      "invalid_error",
      "empty",
      "empty_message",
      "live_label",
      "remove",
      "restore",
      "selected",
      "removed",
    ],
    sample: [
      "news",
      "travel",
      "gaming",
      "music",
      "laundry",
      "fitness_centre",
      "parking",
      "swimming_pool",
      "open",
      "assigned_to_me",
      "urgent",
      "recent",
    ],
  },
});
