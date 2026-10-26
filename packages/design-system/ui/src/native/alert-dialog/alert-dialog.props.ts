/**
 * Stackra file contract:
 * Purpose: `AlertDialogProps`, the props of the native `AlertDialog` in `alert-dialog.tsx`.
 * Boundary: types only; the component and the `./native` entry import it from here.
 * Runtime: react-native
 * Governing contract: ADR 0305 (rules 10 and 12: one declaration per file); ADR 0302 (decision 3, adapted forms); ADR
 *          0303 (decision 7); ADR 0312; ADR 0165 (HeroUI Native on native); WAI-ARIA `alertdialog`; WCAG 2.2 SC 1.4.1
 *          and 4.1.2.
 */
import type { DialogContentProps } from "heroui-native";
import type { AlertDialogContractProps } from "#contracts/types/alert-dialog-contract-props.type";

/**
 * Props of the native AlertDialog: the shared contract plus the props of HeroUI Native's dialog content, passed
 * through (`className`, `style`, `animation`). The role is fixed at `alertdialog`, the swipe is the dismissal rules'
 * to decide, and the children are the contract's, so the type refuses them.
 */
export type AlertDialogProps = AlertDialogContractProps &
  Omit<
    DialogContentProps,
    keyof AlertDialogContractProps | "children" | "role" | "isSwipeable" | "background"
  >;
