/**
 * Stackra file contract:
 * Purpose: `CheckboxProps`, the props of the native `Checkbox` in `checkbox.tsx`.
 * Boundary: types only; the component and the `./native` entry import it from here.
 * Runtime: react-native
 * Governing contract: ADR 0305 (rules 10 and 12: one declaration per file); ADR 0302 (decision 3); ADR 0165 (HeroUI
 *          Native on native); ADR 0303 (decision 7); ADR 0055 (forms); owner decision 6 of STA-350 (thin wrappers).
 */
import type { ControlField } from "heroui-native";
import type { ComponentPropsWithRef } from "react";
import type { CheckboxContractProps } from "#contracts/types/checkbox-contract-props.type";

/**
 * Props of the native Checkbox: the shared contract plus HeroUI Native's ControlField props (a pressable row), passed
 * through unchanged. HeroUI Native's `isSelected`, `onSelectedChange` and `children` are refused: the contract names
 * each of them once.
 */
export type CheckboxProps = CheckboxContractProps &
  Omit<
    ComponentPropsWithRef<typeof ControlField>,
    keyof CheckboxContractProps | "isSelected" | "onSelectedChange" | "children"
  >;
