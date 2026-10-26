/**
 * Stackra file contract:
 * Purpose: the web `Skeleton` on HeroUI v3's Skeleton: draws the placeholder while loading and the children after,
 *          takes its loading state and animation from the enclosing `SkeletonGroup` unless it sets its own, and
 *          passes every other HeroUI prop through unchanged.
 * Boundary: no styling of its own; shape and size are the caller's `className`, the look is HeroUI's, themed by
 *          `@stackra/tokens`.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0165 (UI contract, HeroUI v3 on web); ADR 0304; owner decision 6 of
 *          STA-350 (thin wrappers).
 */
import { Skeleton as HeroSkeleton } from "@heroui/react";
import { useContext } from "react";

import { omitUndefined } from "#core/functions/omit-undefined.function";
import { SkeletonGroupContext } from "#react/skeleton-group/skeleton-group-context";
import type { SkeletonProps } from "#react/skeleton/skeleton.props";

/**
 * A placeholder for content that is still loading; its shape and size are its `className`. It is an empty box, so
 * assistive technology never reaches it: name the loading region with a `SkeletonGroup`'s `loadingLabel`.
 */
export function Skeleton({ isLoading, animationType, children, ...rest }: SkeletonProps) {
  const group = useContext(SkeletonGroupContext);
  if (!(isLoading ?? group?.isLoading ?? true)) return children;
  // In a shimmering group the bone stands still and the group's one sweep passes over it (HeroUI's single shimmer).
  const groupAnimation = group?.animationType === "shimmer" ? "none" : group?.animationType;
  return (
    <HeroSkeleton
      {...rest}
      {...omitUndefined({ animationType: animationType ?? groupAnimation })}
    />
  );
}
