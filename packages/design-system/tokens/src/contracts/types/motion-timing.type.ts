/**
 * Stackra file contract:
 * Purpose: a theme's motion step as numbers, the form an animation library takes: the duration in milliseconds and the
 *          easing as cubic-bezier control points, so web Motion and native Reanimated play a step the way CSS does.
 * Boundary: types only; `motionTiming` derives it from a `MotionToken`.
 * Runtime: isomorphic
 * Governing contract: ADR 0329 (motion layer); ADR 0302 (Stackra Design System).
 */

/** A motion step as numbers. */
export interface MotionTiming {
  /** The duration in milliseconds. */
  readonly durationMs: number;
  /** The easing's cubic-bezier control points `[x1, y1, x2, y2]`; `undefined` for a stepped easing (`steps()`). */
  readonly bezier: readonly [number, number, number, number] | undefined;
}
