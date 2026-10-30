/**
 * Stackra file contract:
 * Purpose: `TAG_GROUP_DEMO_KEYS`, the typed keys of the native tag-group demos' words in `assets/lang/<locale>/demo_free.json`.
 * Boundary: keys only; the words live in the catalogues. A stand-in for the `#stackra/i18n` keys gen writes (STA-339).
 * Runtime: react-native
 * Governing contract: showcase redesign spec (2026-10-27) section 4 (demo contract); ADR 0080 (typed i18n keys).
 */
import { keys } from "@stackra/i18n";

/** The tag-group demos' keys. */
export const TAG_GROUP_DEMO_KEYS = keys({
  demo_free: {
    tag_group: {
      basics: [
        "amenities",
        "fitness",
        "hidden_name",
        "hint",
        "laundry",
        "parking",
        "pool",
        "topics",
      ],
      live: [
        "label",
        "mine",
        "none",
        "open",
        "recent",
        "remove",
        "removed",
        "restore",
        "selected",
        "urgent",
      ],
      selection: ["multiple", "none", "single"],
      sizes: ["size"],
      states: [
        "disabled_group",
        "disabled_tag",
        "empty",
        "empty_message",
        "invalid",
        "invalid_error",
        "read_only",
        "remove",
        "required",
      ],
      topics: ["gaming", "music", "news", "travel"],
    },
  },
});
