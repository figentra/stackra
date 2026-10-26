/**
 * Stackra file contract:
 * Purpose: `AlertDialogProps`, the props of the web `AlertDialog` in `alert-dialog.tsx`.
 * Boundary: types only; the component and the `./react` entry import it from here.
 * Runtime: browser
 * Governing contract: ADR 0305 (rules 10 and 12: one declaration per file); ADR 0302 (decision 3); ADR 0303 (decision
 *          7); ADR 0312; ADR 0165 (HeroUI v3 on web); WAI-ARIA `alertdialog`; WCAG 2.2 SC 1.4.1, 2.1.2 and 4.1.2.
 */
import type { AlertDialogDialogProps } from "@heroui/react";
import type { AlertDialogContractProps } from "#contracts/types/alert-dialog-contract-props.type";

/**
 * Props of the web AlertDialog: the shared contract plus React Aria's dialog props, passed to the dialog element
 * (`className`, `id`, `aria-describedby`, `data-*`). HeroUI's `role` is fixed at `alertdialog`, and its children are
 * the contract's `title`, `description` and `children`, so the type refuses both. HeroUI's `status`, which is the
 * contract's `tone`, is not a dialog prop, so the type refuses that as well.
 */
export type AlertDialogProps = AlertDialogContractProps &
  Omit<AlertDialogDialogProps, keyof AlertDialogContractProps | "children" | "role">;
