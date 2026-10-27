/**
 * Stackra file contract:
 * Purpose: `FloorPlanItemAction`, a screen-reader action on a floor-plan item, named after its `ui_pro::floor_plan.*`
 *          key.
 * Boundary: a type only.
 * Runtime: react-native
 * Governing contract: ADR 0305 (rules 10 to 13); ADR 0310 (decision 3); WCAG 2.2 SC 2.5.7 (a single-pointer way for
 *                     every drag).
 */

/** A screen-reader action on a floor-plan item, named after its `ui_pro::floor_plan.*` key. */
export type FloorPlanItemAction =
  | "move_up"
  | "move_down"
  | "move_start"
  | "move_end"
  | "widen"
  | "narrow"
  | "taller"
  | "shorter";
