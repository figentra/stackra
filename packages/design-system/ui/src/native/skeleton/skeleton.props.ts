/**
 * Stackra file contract:
 * Purpose: `SkeletonProps`, the props of the native `Skeleton` in `skeleton.tsx`.
 * Boundary: types only; the component and the `./native` entry import it from here.
 * Runtime: react-native
 * Governing contract: ADR 0305 (rules 10 and 12: one declaration per file); ADR 0302 (decision 3); ADR 0165 (HeroUI
 *          Native on native); ADR 0304; owner decision 6 of STA-350 (thin wrappers).
 */
import type { SkeletonProps as HeroSkeletonProps } from "heroui-native";
import type { SkeletonContractProps } from "#contracts/types/skeleton-contract-props.type";

/**
 * Props of the native Skeleton: the shared contract plus HeroUI Native's own skeleton props, passed through
 * unchanged. `variant` is the contract's `animationType`, and `onLayout` is refused because HeroUI's own handler
 * measures the shimmer: wrap the Skeleton in a `View` to measure it.
 */
export type SkeletonProps = SkeletonContractProps &
  Omit<HeroSkeletonProps, keyof SkeletonContractProps | "variant" | "onLayout">;
