/**
 * Stackra file contract:
 * Purpose: `ViewStackKeyframes`, what one `ViewStack` move plays on web: the leaving view's frames, the entering
 *          view's frames, the duration and the easing.
 * Boundary: types only.
 * Runtime: isomorphic
 * Governing contract: ADR 0305 (rules 10 and 12: one declaration per file); ADR 0329 (motion layer).
 */

/** What one move plays. */
export interface ViewStackKeyframes {
  /** The leaving view's frames: a transform and an opacity each, and an `offset` (0 to 1) where one is not even. */
  readonly leaving: readonly {
    readonly transform?: string;
    readonly opacity?: number;
    readonly offset?: number;
  }[];
  /** The entering view's frames. */
  readonly entering: readonly {
    readonly transform?: string;
    readonly opacity?: number;
    readonly offset?: number;
  }[];
  /** The duration in milliseconds. */
  readonly durationMs: number;
  /** The CSS easing. */
  readonly easing: string;
}
