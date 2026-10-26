/**
 * Stackra file contract:
 * Purpose: `SchedulerBookingAction`, a screen-reader action on a booking, named after its `ui_pro::scheduler.*` key.
 * Boundary: a type only.
 * Runtime: react-native
 * Governing contract: ADR 0305 (rules 10 to 13); ADR 0310 (decision 3); WCAG 2.2 SC 2.5.7 (a single-pointer way for
 *                     every drag).
 */

/** A screen-reader action on a booking, named after its `ui_pro::scheduler.*` key. */
export type SchedulerBookingAction =
  | "move_earlier"
  | "move_later"
  | "move_previous"
  | "move_next"
  | "lengthen"
  | "shorten";
