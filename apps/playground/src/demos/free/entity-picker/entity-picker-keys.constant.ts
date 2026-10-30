/**
 * Stackra file contract:
 * Purpose: `ENTITY_PICKER_KEYS`, the typed keys of the web Entity picker demos' words in `assets/lang/<locale>/entity_picker.json`.
 * Boundary: keys only; the words live in the catalogues. A stand-in for the `#stackra/i18n` keys gen writes (STA-339).
 * Runtime: browser
 * Governing contract: ADR 0080 (typed i18n keys); ADR 0231 (`<module>::<path>`); ADR 0305 (catalogue layout).
 */
import { keys } from "@stackra/i18n";

/** The entity_picker namespace's keys. */
export const ENTITY_PICKER_KEYS = keys({
  entity_picker: [
    "owner_label",
    "owner_placeholder",
    "team_label",
    "team_placeholder",
    "reviewer_label",
    "reviewer_description",
    "reviewers_label",
    "remove",
    "slow_label",
    "loading",
    "failing_label",
    "failed",
    "create_label",
    "create_row",
    "required",
    "invalid",
    "invalid_error",
    "disabled",
    "read_only",
    "empty",
    "live_owner",
    "live_followers",
    "chosen_owner",
    "chosen_followers",
  ],
});
