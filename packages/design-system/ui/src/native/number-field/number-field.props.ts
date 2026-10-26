/**
 * Stackra file contract:
 * Purpose: `NumberFieldProps`, the props of the native `NumberField` in `number-field.tsx`.
 * Boundary: types only; the component and the `./native` entry import it from here.
 * Runtime: react-native
 * Governing contract: ADR 0305 (rules 10 and 12: one declaration per file); ADR 0302 (decision 3); ADR 0303 (decision
 *          7); ADR 0318 (decision 9); ADR 0055 (forms: one field contract); ADR 0165 (HeroUI Native on native); WCAG
 *          2.2 SC 1.3.1, 4.1.2.
 */
import type { InputGroup as HeroInputGroup } from "heroui-native";
import type { ComponentPropsWithRef } from "react";
import type { NumberFieldContractProps } from "#contracts/types/number-field-contract-props.type";

/**
 * Props of the native NumberField: the shared contract plus HeroUI Native's input props, passed through to the input.
 * The contract's names replace HeroUI's and React Native's: `onChange` for `onChangeText`, `isReadOnly` for `readOnly`
 * and `editable`, `isDisabled` and `isInvalid` for the input's own.
 */
export type NumberFieldProps = NumberFieldContractProps &
  Omit<
    ComponentPropsWithRef<typeof HeroInputGroup.Input>,
    keyof NumberFieldContractProps | "children" | "onChangeText" | "readOnly" | "editable"
  >;
