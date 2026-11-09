/**
 * Stackra file contract:
 * Purpose: `SCHEDULING_BOARD_KEYS`, the typed keys of the SchedulingBoard's own words in `assets/lang/<locale>/ui.json`:
 *          the navigation and views, the spoken names of blocks and empty slots, the drag announcements, the board's
 *          own conflict reasons, the kinds and day statuses, and native's accessibility actions.
 * Boundary: internal: the web and native SchedulingBoard import it by path. Each key exists in all seven base locales;
 *           the Arabic words wait on Qossai's review.
 * Runtime: isomorphic
 * Governing contract: ADR 0080 (typed i18n keys); ADR 0231 (`<module>::<path>`); ADR 0403 (seven languages); shared
 *                     modules step 4a (LEADER, 2026-11-09).
 */
import { keys } from "@stackra/i18n";

/** The SchedulingBoard's keys. */
export const SCHEDULING_BOARD_KEYS = keys({
  ui: {
    scheduling_board: [
      "previous",
      "next",
      "today",
      "view",
      "day",
      "week",
      "timeline",
      "resources",
      "now",
      "empty",
      "loading",
      "item",
      "item_status",
      "slot",
      "fill",
      "expires",
      "inherited",
      "pending",
      "moving",
      "selecting",
      "moving_touch",
      "selecting_touch",
      "moved",
      "selected",
      "cancelled",
      "reverted",
      "conflict_closure",
      "conflict_overlap",
      "conflict_outside_hours",
      "conflict_in_past",
      "kind_booking",
      "kind_hold",
      "kind_closure",
      "kind_block",
      "kind_working_time",
      "day_rest_day",
      "day_holiday",
      "day_uncertain",
      "action_earlier",
      "action_later",
      "action_up",
      "action_down",
      "action_extend",
      "action_shorten",
      "action_open",
      "show_group",
      "hide_group",
    ],
  },
});
