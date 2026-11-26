/**
 * Stackra file contract:
 * Purpose: `FloorStepsOptions`, what `useFloorSteps` needs to play a whole-step reveal: how many steps there are,
 *          whether it may play, when it starts, how much of the element must be in view and the step's length.
 * Boundary: types only.
 * Runtime: browser
 * Governing contract: ADR 0305 (one declaration per file); motion principles (the `floor` motion step); STA-2041.
 */

/** The options of `useFloorSteps`. */
export interface FloorStepsOptions {
  /** How many steps the reveal has; it holds on the last. */
  readonly total: number;
  /** Whether it may play at all; it plays only at the `full` motion level on top of this. Defaults to true. */
  readonly isEnabled?: boolean | undefined;
  /** Starts at once instead of waiting to come into view. Defaults to false. */
  readonly startsAtOnce?: boolean | undefined;
  /** The share of the element that must be in view before it starts, 0 to 1. Defaults to 0.2. */
  readonly threshold?: number | undefined;
  /** The time between steps in milliseconds. Defaults to the theme's `floor` motion step. */
  readonly stepMs?: number | undefined;
}
