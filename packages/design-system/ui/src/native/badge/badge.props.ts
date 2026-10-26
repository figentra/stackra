/**
 * Stackra file contract:
 * Purpose: `BadgeProps`, the props of the native `Badge` in `badge.tsx`.
 * Boundary: types only; the component and the `./native` entry import it from here.
 * Runtime: react-native
 * Governing contract: ADR 0305 (rules 10 and 12: one declaration per file); ADR 0302 (decisions 3 and 5: parity,
 *          adapted form); ADR 0165 (HeroUI Native on native); ADR 0304; ADR 0060; owner decision 6 of STA-350 (thin
 *          wrappers).
 */
import type { ChipProps } from "heroui-native";
import type { StyleProp, ViewStyle } from "react-native";
import type { BadgeContractProps } from "#contracts/types/badge-contract-props.type";

/**
 * Props of the native Badge: the shared contract plus the HeroUI Native Chip props a non-pressable badge can use.
 * HeroUI's `color` is the contract's `tone`; `label` owns the accessibility props; the press-state `style` function
 * is not taken, because the wrapper composes `style` as an array.
 */
export type BadgeProps = BadgeContractProps &
  Omit<
    ChipProps,
    | keyof BadgeContractProps
    | "color"
    | "style"
    | "disabled"
    | "pointerEvents"
    | "onPress"
    | "onLongPress"
    | "onPressIn"
    | "onPressOut"
    | "accessible"
    | "accessibilityLabel"
    | "aria-label"
  > & {
    /** Styles drawn after the corner position, so a caller can nudge the badge; a press-state function is not taken. */
    readonly style?: StyleProp<ViewStyle>;
  };
