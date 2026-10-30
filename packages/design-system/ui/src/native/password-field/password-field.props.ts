/**
 * Stackra file contract:
 * Purpose: `PasswordFieldProps`, the props of the native `PasswordField` in `password-field.tsx`.
 * Boundary: types only; the component and the `./native` entry import it from here.
 * Runtime: react-native
 * Governing contract: ADR 0305 (rules 10 and 12: one declaration per file); ADR 0302 (decision 3); gap inventory row 3.
 */
import type { InputGroup as HeroInputGroup } from "heroui-native";
import type { ComponentPropsWithRef } from "react";
import type { PasswordFieldContractProps } from "#contracts/types/password-field-contract-props.type";

/**
 * Props of the native PasswordField: the shared contract plus HeroUI Native's input props, passed to the input. The
 * field owns the masking and the keyboard, so `secureTextEntry` and `keyboardType` are refused.
 */
export type PasswordFieldProps = PasswordFieldContractProps &
  Omit<
    ComponentPropsWithRef<typeof HeroInputGroup.Input>,
    | keyof PasswordFieldContractProps
    | "children"
    | "onChangeText"
    | "readOnly"
    | "editable"
    | "secureTextEntry"
    | "keyboardType"
  >;
