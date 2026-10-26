/**
 * Stackra file contract:
 * Purpose: `ChipProps`, the props of the native `Chip` in `chip.tsx`.
 * Boundary: types only; the component and the `./native` entry import it from here.
 * Runtime: react-native
 * Governing contract: ADR 0305 (rules 10 and 12: one declaration per file); ADR 0302 (decision 3); ADR 0165 (HeroUI
 *          Native on native); ADR 0304 (decision 3); owner decision 6 of STA-350 (thin wrappers).
 */
import type { Chip as HeroChip } from "heroui-native";
import type { ComponentPropsWithRef } from "react";
import type { ChipContractProps } from "#contracts/types/chip-contract-props.type";

/**
 * Props of the native Chip: the shared contract plus HeroUI Native's own chip props, passed through unchanged.
 * HeroUI's `color` is the contract's `tone`; the four press handlers are refused, as `onClick` is on web.
 */
export type ChipProps = ChipContractProps &
  Omit<
    ComponentPropsWithRef<typeof HeroChip>,
    keyof ChipContractProps | "color" | "onPress" | "onPressIn" | "onPressOut" | "onLongPress"
  >;
