/**
 * Stackra file contract:
 * Purpose: the native `Skeleton` on HeroUI Native's Skeleton, or its `SkeletonGroup.Item` inside a `SkeletonGroup`:
 *          maps `animationType` to `variant`, forwards only the contract keys the caller set so the group's values
 *          hold, and passes every other HeroUI Native prop through unchanged, the motion config (`animation`)
 *          included.
 * Boundary: no styling of its own; shape and size are the caller's `className`.
 * Runtime: react-native
 * Governing contract: ADR 0302 (decision 3); ADR 0165 (HeroUI Native on native); ADR 0304; owner decision 6 of
 *          STA-350 (thin wrappers).
 */
import {
  Skeleton as HeroSkeleton,
  SkeletonGroup as HeroSkeletonGroup,
  type SkeletonProps as HeroSkeletonProps,
} from "heroui-native";
import { useContext } from "react";

import type { SkeletonContractProps } from "#contracts/types/skeleton-contract-props.type";
import { omitUndefined } from "#core/functions/omit-undefined.function";
import { SkeletonGroupContext } from "#native/skeleton-group/skeleton-group-context";

/**
 * Props of the native Skeleton: the shared contract plus HeroUI Native's own skeleton props, passed through
 * unchanged. `variant` is the contract's `animationType`, and `onLayout` is refused because HeroUI's own handler
 * measures the shimmer: wrap the Skeleton in a `View` to measure it.
 */
export type SkeletonProps = SkeletonContractProps &
  Omit<HeroSkeletonProps, keyof SkeletonContractProps | "variant" | "onLayout">;

/**
 * A placeholder for content that is still loading; its shape and size are its `className`. It is an empty box, so
 * assistive technology never reaches it: name the loading region with a `SkeletonGroup`'s `loadingLabel`.
 */
export function Skeleton({ isLoading, animationType, ...rest }: SkeletonProps) {
  const Bone = useContext(SkeletonGroupContext) ? HeroSkeletonGroup.Item : HeroSkeleton;
  // Only the keys the caller set: HeroUI's group item spreads its own props over the group's, `undefined` included.
  return <Bone {...rest} {...omitUndefined({ isLoading, variant: animationType })} />;
}
