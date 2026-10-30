/**
 * Stackra file contract:
 * Purpose: `DATE_LABEL_KEYS`, the typed keys of the `DateLabel`'s own words in `assets/lang/<locale>/ui.json`
 *          (`ui::date_label.*`): the state words and the two sentences that join them to the date.
 * Boundary: keys only; internal. Kept beside `UI_KEYS` so parallel builds never edit that file; fold it in later.
 * Runtime: isomorphic
 * Governing contract: ADR 0080 (typed i18n keys); ADR 0231 (`<module>::<path>`); ADR 0403 (seven languages).
 */
import { keys } from "@stackra/i18n";

/** The date label's keys. */
export const DATE_LABEL_KEYS = keys({
  ui: {
    date_label: ["due_soon", "overdue", "expiring_soon", "expired", "with_state", "with_date"],
  },
});
