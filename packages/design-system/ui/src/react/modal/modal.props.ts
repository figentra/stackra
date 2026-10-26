/**
 * Stackra file contract:
 * Purpose: `ModalProps`, the props of the web `Modal` in `modal.tsx`.
 * Boundary: types only; the component and the `./react` entry import it from here.
 * Runtime: browser
 * Governing contract: ADR 0305 (rules 10 and 12: one declaration per file); ADR 0302 (decision 3); ADR 0303 (decision
 *          7); ADR 0312; ADR 0165 (HeroUI v3 on web); owner decision 6 of STA-350 (thin wrappers); WCAG 2.2 SC 2.1.2,
 *          2.4.3 and 4.1.2.
 */
import type { ModalDialogProps as HeroModalDialogProps } from "@heroui/react";
import type { ModalContractProps } from "#contracts/types/modal-contract-props.type";

/**
 * Props of the web Modal: the shared contract plus HeroUI v3's own dialog props, passed through to the dialog.
 * HeroUI's `aria-label` is the contract's `label`.
 */
export type ModalProps = ModalContractProps &
  Omit<HeroModalDialogProps, keyof ModalContractProps | "aria-label">;
