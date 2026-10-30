/**
 * Stackra file contract:
 * Purpose: `INPUT_GROUP_KEYS`, the typed keys of the web Input group demos' words in `assets/lang/<locale>/input_group.json`.
 * Boundary: keys only; the words live in the catalogues. A stand-in for the `#stackra/i18n` keys gen writes (STA-339).
 * Runtime: browser
 * Governing contract: ADR 0080 (typed i18n keys); ADR 0231 (`<module>::<path>`); ADR 0305 (catalogue layout).
 */
import { keys } from "@stackra/i18n";

/** The input_group namespace's keys. */
export const INPUT_GROUP_KEYS = keys({
  input_group: [
    "primary",
    "secondary",
    "prefix_only",
    "suffix_only",
    "both",
    "amount",
    "weight",
    "search_label",
    "password_label",
    "show",
    "hide",
    "show_short",
    "hide_short",
    "required",
    "invalid",
    "invalid_message",
    "disabled",
    "read_only",
    "full",
    "content",
    "live_label",
    "live_description",
    "live_preview",
  ],
});
