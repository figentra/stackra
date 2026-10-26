/**
 * Stackra file contract:
 * Purpose: `AvatarProps`, the props of the native `Avatar` in `avatar.tsx`.
 * Boundary: types only; the component and the `./native` entry import it from here.
 * Runtime: react-native
 * Governing contract: ADR 0305 (rules 10 and 12: one declaration per file); ADR 0302 (decision 3); ADR 0165 (HeroUI
 *          Native on native); ADR 0303 (decision 7); ADR 0304; owner decision 6 of STA-350 (thin wrappers).
 */
import type { AvatarRootProps } from "heroui-native";
import type { AvatarContractProps } from "#contracts/types/avatar-contract-props.type";

/**
 * Props of the native Avatar: the shared contract plus HeroUI Native's own avatar root props, passed through
 * unchanged. HeroUI's `color` is the contract's `tone`, the wrapper builds the children, and `label` owns the
 * accessible name, so `alt` and the raw accessibility props are refused.
 */
export type AvatarProps = AvatarContractProps &
  Omit<
    AvatarRootProps,
    | keyof AvatarContractProps
    | "color"
    | "children"
    | "alt"
    | "accessible"
    | "role"
    | "accessibilityRole"
    | "accessibilityLabel"
    | "aria-label"
    | "aria-hidden"
    | "accessibilityElementsHidden"
    | "importantForAccessibility"
  >;
