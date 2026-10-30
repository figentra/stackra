/**
 * Stackra file contract:
 * Purpose: `AvatarGroupProps`, the props of the native `AvatarGroup` in `avatar-group.tsx`.
 * Boundary: types only; the component and the `./native` entry import it from here.
 * Runtime: react-native
 * Governing contract: ADR 0305 (rules 10 and 12: one declaration per file); ADR 0302 (decision 3); design-system gap
 *          inventory row 25.
 */
import type { PressableProps } from "react-native";
import type { AvatarGroupContractProps } from "#contracts/types/avatar-group-contract-props.type";

/**
 * Props of the native AvatarGroup: the shared contract plus the root `Pressable`'s own props, passed through. A press
 * fans the group out and `label` names it, so `children`, `onPress` and the raw accessibility props are refused.
 */
export type AvatarGroupProps = AvatarGroupContractProps &
  Omit<
    PressableProps,
    | keyof AvatarGroupContractProps
    | "children"
    | "onPress"
    | "accessible"
    | "accessibilityRole"
    | "accessibilityLabel"
  >;
