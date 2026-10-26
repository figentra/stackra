/**
 * Stackra file contract:
 * Purpose: `SwitchProps`, the props of the native `Switch` in `switch.tsx`.
 * Boundary: types only; the component and the `./native` entry import it from here.
 * Runtime: react-native
 * Governing contract: ADR 0305 (rules 10 and 12: one declaration per file); ADR 0302 (decision 3); ADR 0165 (HeroUI
 *          Native on native); ADR 0303 (decision 7); ADR 0055 (forms); owner decision 6 of STA-350 (thin wrappers).
 */
import type { ControlField } from "heroui-native";
import type { ComponentPropsWithRef } from "react";
import type { SwitchContractProps } from "#contracts/types/switch-contract-props.type";

/**
 * Props of the native Switch: the shared contract plus HeroUI Native's ControlField props (a pressable row), passed
 * through unchanged. HeroUI Native's `isSelected`, `onSelectedChange` and `children` are refused: the contract names
 * each of them once.
 */
export type SwitchProps = SwitchContractProps &
  Omit<
    ComponentPropsWithRef<typeof ControlField>,
    keyof SwitchContractProps | "isSelected" | "onSelectedChange" | "children"
  >;
