/**
 * Stackra file contract:
 * Purpose: `SCHEDULER_KEYS`, the typed keys of the Scheduler's own words in `assets/lang/<locale>/ui.json`: the
 *          navigation, the view names, the all-day row, "N more", the empty agenda and the spoken names of events and
 *          empty hours.
 * Boundary: internal: the web and native Scheduler import it by path. Each key exists in all seven base locales.
 * Runtime: isomorphic
 * Governing contract: ADR 0080 (typed i18n keys); ADR 0231 (`<module>::<path>`); ADR 0403 (seven languages); STA-1371.
 */
import { keys } from "@stackra/i18n";

/** The Scheduler's keys. */
export const SCHEDULER_KEYS = keys({
  ui: {
    scheduler: [
      "previous",
      "next",
      "today",
      "view",
      "day",
      "week",
      "month",
      "agenda",
      "all_day",
      "more",
      "no_events",
      "event",
      "slot",
      "now",
    ],
  },
});
