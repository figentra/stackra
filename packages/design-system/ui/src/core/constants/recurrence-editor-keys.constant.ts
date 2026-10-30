/**
 * Stackra file contract:
 * Purpose: `RECURRENCE_EDITOR_KEYS`, the typed keys of RecurrenceEditor's own words in `assets/lang/<locale>/ui.json`
 *          (`ui::recurrence_editor.*`): the controls' names and the sentences of the rule's summary.
 * Boundary: internal: the web and native editors and `recurrenceSummaryOf` import it by path; no entry exports it. Kept
 *           apart from `UI_KEYS` so parallel builds never edit one shared file.
 * Runtime: isomorphic
 * Governing contract: ADR 0080 (typed i18n keys); ADR 0231 (`<module>::<path>`); ADR 0403 (seven languages).
 */
import { keys } from "@stackra/i18n";

/** The typed keys of RecurrenceEditor's own words. */
export const RECURRENCE_EDITOR_KEYS = keys({
  ui: {
    recurrence_editor: [
      "label",
      "every",
      "unit",
      "weekdays",
      "monthly",
      "ends",
      "never",
      "until_label",
      "count_label",
      "end_date",
      "occurrences",
      "summary",
      "every_unit",
      "on_days",
      "on_day",
      "on_last_day",
      "on_nth",
      "on_date",
      "until",
      "times",
      "hijri",
      "day_option",
      "last_day_option",
      "nth_option",
    ],
  },
});
