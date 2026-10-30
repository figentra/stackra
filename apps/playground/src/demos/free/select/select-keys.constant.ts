/**
 * Stackra file contract:
 * Purpose: `SELECT_KEYS`, the typed keys of the web Select demos' words in `assets/lang/<locale>/select.json`.
 * Boundary: keys only; the words live in the catalogues. A stand-in for the `#stackra/i18n` keys gen writes (STA-339).
 * Runtime: browser
 * Governing contract: ADR 0080 (typed i18n keys); ADR 0231 (`<module>::<path>`); ADR 0305 (catalogue layout).
 */
import { keys } from "@stackra/i18n";

/** The select namespace's keys. */
export const SELECT_KEYS = keys({
  select: {
    _: [
      "status_label",
      "status_placeholder",
      "described_label",
      "described_placeholder",
      "description",
      "hidden_label_name",
      "rich_label",
      "rich_placeholder",
      "with_value",
      "required",
      "invalid",
      "invalid_error",
      "disabled",
      "read_only",
      "full_width",
      "full_width_note",
      "live_label",
      "chosen",
      "clear",
      "sections_label",
      "sections_placeholder",
    ],
    sample: [
      "draft",
      "sent",
      "paid",
      "void",
      "post",
      "courier",
      "pickup",
      "newest_first",
      "oldest_first",
      "free",
      "for_one_person_up_to",
      "team",
      "for_a_group_with_shared",
      "scale",
      "for_a_company_with_audit",
      "legacy",
      "no_longer_sold",
      "africa",
      "europe",
      "middle_east",
      "cairo",
      "lagos",
      "paris",
      "berlin",
      "riyadh",
      "dubai",
    ],
  },
});
