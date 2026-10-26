/**
 * Stackra file contract:
 * Purpose: `ModalCloseProps`, the props of the native `ModalClose` in `modal-close.tsx`.
 * Boundary: types only; the component and the `./native` entry import it from here.
 * Runtime: react-native
 * Governing contract: ADR 0305 (rules 10 and 12: one declaration per file); ADR 0302 (decision 3); ADR 0303 (decision
 *          7); ADR 0312; WCAG 2.2 SC 2.5.8 and 4.1.2.
 */
import type { DialogCloseProps as HeroDialogCloseProps } from "heroui-native";
import type { CloseButtonContractProps } from "#contracts/types/close-button-contract-props.type";
import type { DistributiveOmit } from "#contracts/types/distributive-omit.type";

/**
 * Props of the native Modal.Close: the close-button contract plus HeroUI Native's own close props, passed through.
 * HeroUI's accessibility name is the contract's `label`, and its children are the contract's `icon`.
 */
export type ModalCloseProps = CloseButtonContractProps &
  DistributiveOmit<
    HeroDialogCloseProps,
    keyof CloseButtonContractProps | "children" | "accessibilityLabel" | "aria-label"
  >;
