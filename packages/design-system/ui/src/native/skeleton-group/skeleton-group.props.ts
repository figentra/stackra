/**
 * Stackra file contract:
 * Purpose: `SkeletonGroupProps`, the props of the native `SkeletonGroup` in `skeleton-group.tsx`.
 * Boundary: types only; the component and the `./native` entry import it from here.
 * Runtime: react-native
 * Governing contract: ADR 0305 (rules 10 and 12: one declaration per file); ADR 0302 (decision 3); ADR 0165 (HeroUI
 *          Native on native); ADR 0304; WCAG 2.2 SC 4.1.3.
 */
import type { SkeletonGroupRootProps } from "heroui-native";
import type { SkeletonGroupContractProps } from "#contracts/types/skeleton-group-contract-props.type";

/**
 * Props of the native SkeletonGroup: the shared contract plus HeroUI Native's own group props, passed through
 * unchanged. `variant` is the contract's `animationType`.
 */
export type SkeletonGroupProps = SkeletonGroupContractProps &
  Omit<SkeletonGroupRootProps, keyof SkeletonGroupContractProps | "variant">;
