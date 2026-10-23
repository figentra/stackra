/**
 * Stackra file contract:
 * Purpose: the props every runtime's `Skeleton` takes: whether the content is still loading, how the placeholder
 *          moves, and the content it stands for. Shape and size are HeroUI's `className`, passed through. Each
 *          runtime's `SkeletonProps` is this plus its HeroUI skeleton's own props, which pass through unchanged.
 * Boundary: types only.
 * Runtime: isomorphic
 * Governing contract: ADR 0302 (decision 3: one API on web and native); ADR 0165 (UI contract); ADR 0303 (decision
 *          7); ADR 0304.
 */
import type { ReactNode } from "react";

import type { SkeletonAnimation } from "#contracts/enums/skeleton-animation.enum";

/** Props shared by the web and native `Skeleton`. */
export interface SkeletonContractProps {
  /** The content the placeholder stands for, drawn in its place once loading ends and never while it loads. */
  readonly children?: ReactNode;
  /** True while the content loads, showing the placeholder; defaults to true, or to the enclosing group's value. */
  readonly isLoading?: boolean | undefined;
  /** How the placeholder moves while loading; defaults to `shimmer`, or to the enclosing group's animation. */
  readonly animationType?: SkeletonAnimation | undefined;
}
