/**
 * Stackra file contract:
 * Purpose: the context through which a web SkeletonGroup hands its loading state and animation to the Skeletons inside
 *          it; `null` outside a group.
 * Boundary: the context object only; internal, in no barrel.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0304.
 */
import { createContext } from "react";

import type { SkeletonAnimation } from "#contracts/enums/skeleton-animation.enum";

/** What a web SkeletonGroup shares with the Skeletons inside it. */
export interface SkeletonGroupState {
  /** Whether the group is loading. */
  readonly isLoading: boolean;
  /** The group's animation. */
  readonly animationType: SkeletonAnimation;
}

/** The nearest web SkeletonGroup's state, or `null` outside one. */
export const SkeletonGroupContext = createContext<SkeletonGroupState | null>(null);
