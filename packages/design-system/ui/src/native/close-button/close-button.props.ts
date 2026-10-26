/**
 * Stackra file contract:
 * Purpose: `CloseButtonProps`, the props of the native `CloseButton` in `close-button.tsx`.
 * Boundary: types only; the component and the `./native` entry import it from here.
 * Runtime: react-native
 * Governing contract: ADR 0305 (rules 10 and 12: one declaration per file); ADR 0302 (decision 3); ADR 0303 (decision
 *          7); ADR 0165 (HeroUI Native on native); ADR 0319 (the glass close button).
 */
import type { CloseButtonProps as HeroCloseButtonProps } from "heroui-native";
import type { CloseButtonContractProps } from "#contracts/types/close-button-contract-props.type";
import type { DistributiveOmit } from "#contracts/types/distributive-omit.type";

/**
 * Props of the native CloseButton: the shared contract plus HeroUI Native's own close-button props, passed through
 * (`iconProps`, `size`, `variant`, `hitSlop`, `feedbackVariant` and `animation` among them). HeroUI's accessibility
 * name is the contract's `label`, and its children are the contract's `icon`.
 */
export type CloseButtonProps = CloseButtonContractProps &
  DistributiveOmit<
    HeroCloseButtonProps,
    keyof CloseButtonContractProps | "children" | "accessibilityLabel" | "aria-label"
  >;
