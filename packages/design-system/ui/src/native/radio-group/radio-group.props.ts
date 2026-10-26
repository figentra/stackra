/**
 * Stackra file contract:
 * Purpose: `RadioGroupProps`, the props of the native `RadioGroup` in `radio-group.tsx`.
 * Boundary: types only; the component and the `./native` entry import it from here.
 * Runtime: react-native
 * Governing contract: ADR 0305 (rules 10 and 12: one declaration per file); ADR 0302 (decision 3); ADR 0165 (HeroUI
 *          Native on native); ADR 0303 (decision 7); ADR 0055 (forms); owner decision 6 of STA-350 (thin wrappers).
 */
import type { RadioGroup as HeroRadioGroup } from "heroui-native";
import type { ComponentPropsWithRef } from "react";
import type { RadioGroupContractProps } from "#contracts/types/radio-group-contract-props.type";

/**
 * Props of the native RadioGroup: the shared contract plus HeroUI Native's own group props, passed through
 * unchanged. HeroUI Native's `onValueChange` and `children` are refused: the contract names `onChange` and the
 * options are the content.
 */
export type RadioGroupProps = RadioGroupContractProps &
  Omit<
    ComponentPropsWithRef<typeof HeroRadioGroup>,
    keyof RadioGroupContractProps | "onValueChange" | "children"
  >;
