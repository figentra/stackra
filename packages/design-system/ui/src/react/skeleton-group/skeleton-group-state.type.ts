/**
 * Stackra file contract:
 * Purpose: `SkeletonGroupState`: what a web SkeletonGroup shares with the Skeletons inside it.
 * Boundary: types only.
 * Runtime: browser
 * Governing contract: ADR 0305 (rules 10 and 12: one declaration per file); ADR 0302 (decision 3); ADR 0304.
 */
import type { SkeletonAnimation } from "#contracts/enums/skeleton-animation.enum";

/** What a web SkeletonGroup shares with the Skeletons inside it. */
export interface SkeletonGroupState {
  /** Whether the group is loading. */
  readonly isLoading: boolean;
  /** The group's animation. */
  readonly animationType: SkeletonAnimation;
}
