/**
 * Stackra file contract:
 * Purpose: `TextAreaProps`, the props of the native `TextArea` in `text-area.tsx`.
 * Boundary: types only; the component and the `./native` entry import it from here.
 * Runtime: react-native
 * Governing contract: ADR 0305 (rules 10 and 12: one declaration per file); ADR 0302 (decision 3); ADR 0303 (decision
 *          7); ADR 0165 (HeroUI Native on native); ADR 0055 (forms: one field contract); owner decision 6 of STA-350
 *          (thin wrappers).
 */
import type { TextArea as HeroTextArea } from "heroui-native";
import type { ComponentPropsWithRef } from "react";
import type { TextAreaContractProps } from "#contracts/types/text-area-contract-props.type";

/**
 * Props of the native TextArea: the shared contract plus HeroUI Native's text area props, passed through to the input.
 * The contract's names replace HeroUI's and React Native's: `onChange` for `onChangeText`, `isReadOnly` for `readOnly`
 * and `editable`, `isDisabled` and `isInvalid` for the input's own.
 */
export type TextAreaProps = TextAreaContractProps &
  Omit<
    ComponentPropsWithRef<typeof HeroTextArea>,
    keyof TextAreaContractProps | "children" | "onChangeText" | "readOnly" | "editable"
  >;
