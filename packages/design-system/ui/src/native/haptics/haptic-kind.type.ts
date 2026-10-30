/**
 * Stackra file contract:
 * Purpose: `HapticKind`: the feedback a native control can play, in the platform's vocabulary.
 * Boundary: types only.
 * Runtime: react-native
 * Governing contract: ADR 0305 (rules 10 and 12: one declaration per file).
 */

/**
 * `impact` (or `light`) a light tap for a press, `medium` a firmer one for a page change, `rigid` a hard stop at a
 * bound, `selection` a tick when a choice changes, and `success`, `warning` and `error` the outcome of an action.
 */
export type HapticKind =
  | "impact"
  | "light"
  | "medium"
  | "rigid"
  | "selection"
  | "success"
  | "warning"
  | "error";
