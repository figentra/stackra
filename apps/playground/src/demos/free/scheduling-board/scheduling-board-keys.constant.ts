/**
 * Stackra file contract:
 * Purpose: `SCHEDULING_BOARD_KEYS`, the typed keys of the web SchedulingBoard demos' words in
 *          `assets/lang/<locale>/scheduling_board.json`.
 * Boundary: keys only; the words live in the catalogues. A stand-in for the `#stackra/i18n` keys gen writes (STA-339).
 * Runtime: browser
 * Governing contract: ADR 0080 (typed i18n keys); ADR 0231 (`<module>::<path>`); ADR 0305 (catalogue layout).
 */
import { keys } from "@stackra/i18n";

/** The demos' keys. */
export const SCHEDULING_BOARD_KEYS = keys({
  scheduling_board: {
    _: [
      "day_label",
      "week_label",
      "timeline_label",
      "read_only_label",
      "drag_label",
      "north",
      "south",
      "pitch_1",
      "pitch_1_half_a",
      "coach",
      "pool",
      "training",
      "five_a_side",
      "swim_class",
      "held",
      "cleaning",
      "maintenance",
      "coach_break",
      "coach_leave",
      "selected",
      "picked",
      "checking",
      "refused",
      "coach_leaves",
    ],
    rtl: [
      "label",
      "north",
      "south",
      "pitch_1",
      "pitch_1_half_a",
      "coach",
      "pool",
      "training",
      "swim_class",
      "held",
      "cleaning",
      "holiday",
    ],
  },
});
