/**
 * Stackra file contract:
 * Purpose: `ModalProps`, the props of the native `Modal` in `modal.tsx`.
 * Boundary: types only; the component and the `./native` entry import it from here.
 * Runtime: react-native
 * Governing contract: ADR 0305 (rules 10 and 12: one declaration per file); ADR 0302 (decision 3); ADR 0303 (decision
 *          7); ADR 0312; ADR 0165 (HeroUI Native on native); owner decision 6 of STA-350 (thin wrappers); WCAG 2.2 SC
 *          2.1.2, 2.4.3 and 4.1.2.
 */
import type { DialogContentProps as HeroDialogContentProps } from "heroui-native";
import type { ModalContractProps } from "#contracts/types/modal-contract-props.type";

/**
 * Props of the native Modal: the shared contract plus HeroUI Native's own dialog content props, passed through.
 * HeroUI Native's `isSwipeable` is the contract's `isDismissable`, so the type refuses it.
 */
export type ModalProps = ModalContractProps &
  Omit<HeroDialogContentProps, keyof ModalContractProps | "isSwipeable" | "accessibilityLabel">;
