/**
 * Stackra file contract:
 * Purpose: `CheckboxGroupProps`, the props of the native `CheckboxGroup` in `checkbox-group.tsx`.
 * Boundary: types only; the component and the `./native` entry import it from here.
 * Runtime: react-native
 * Governing contract: ADR 0305 (rules 10 and 12: one declaration per file); ADR 0302 (decision 3); ADR 0165 (HeroUI
 *          Native on native); ADR 0303 (decision 7); ADR 0055 (forms); owner decision 6 of STA-350 (thin wrappers).
 */
import type { ViewProps } from "react-native";
import type { CheckboxGroupContractProps } from "#contracts/types/checkbox-group-contract-props.type";

/**
 * Props of the native CheckboxGroup: the shared contract plus React Native's `View` props, passed through
 * unchanged. `children` is refused: the options are the content.
 */
export type CheckboxGroupProps = CheckboxGroupContractProps &
  Omit<ViewProps, keyof CheckboxGroupContractProps | "children">;
