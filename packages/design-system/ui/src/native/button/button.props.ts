/**
 * Stackra file contract:
 * Purpose: `ButtonProps`, the props of the native `Button` in `button.tsx`.
 * Boundary: types only; the component and the `./native` entry import it from here.
 * Runtime: react-native
 * Governing contract: ADR 0305 (rules 10 and 12: one declaration per file); ADR 0302 (decision 3); ADR 0303 (decision
 *          7); ADR 0165 (HeroUI Native on native); owner decision 6 of STA-350; ADR 0319 (the glass quiet variants).
 */
import type { ButtonRootProps } from "heroui-native";
import type { ButtonContractProps } from "#contracts/types/button-contract-props.type";
import type { DistributiveOmit } from "#contracts/types/distributive-omit.type";

/**
 * Props of the native Button: the shared contract plus HeroUI Native's own button props, passed through unchanged.
 * The omitted names are the contract's own: `label` is the accessible name, `isDisabled` and `isLoading` own the
 * pressable's `disabled`, and `IconButton` owns `isIconOnly`.
 */
export type ButtonProps = ButtonContractProps &
  DistributiveOmit<
    ButtonRootProps,
    keyof ButtonContractProps | "isIconOnly" | "accessibilityLabel" | "aria-label" | "disabled"
  >;
