/**
 * Stackra file contract:
 * Purpose: `SpringToken`, part of the token schema of the Stackra Design System (see `Theme`): one spring preset as
 *          physics (stiffness, damping, mass), the form web Motion and native Reanimated both take, and the source the
 *          web stylesheet samples into a CSS `linear()` curve.
 * Boundary: a type only.
 * Runtime: isomorphic
 * Governing contract: ADR 0501 (tokens v2, the motion family); ADR 0329 (motion layer).
 */

/** One spring preset. */
export interface SpringToken {
  /** The spring's stiffness, above 0 (Reanimated and Motion `stiffness`). */
  readonly stiffness: number;
  /** The damping, above 0 (Reanimated and Motion `damping`). */
  readonly damping: number;
  /** The moving mass, above 0 (Reanimated and Motion `mass`). */
  readonly mass: number;
}
