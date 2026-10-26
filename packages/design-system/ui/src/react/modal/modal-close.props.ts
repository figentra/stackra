/**
 * Stackra file contract:
 * Purpose: `ModalCloseProps`, the props of the web `ModalClose` in `modal-close.tsx`.
 * Boundary: types only; the component and the `./react` entry import it from here.
 * Runtime: browser
 * Governing contract: ADR 0305 (rules 10 and 12: one declaration per file); ADR 0302 (decision 3); ADR 0303 (decision
 *          7); ADR 0312; WCAG 2.2 SC 2.5.8 and 4.1.2.
 */
import type { ModalCloseTriggerProps as HeroModalCloseProps } from "@heroui/react";
import type { CloseButtonContractProps } from "#contracts/types/close-button-contract-props.type";

/**
 * Props of the web Modal.Close: the close-button contract plus HeroUI v3's own close-trigger props, passed through.
 * HeroUI's `aria-label` is the contract's `label`, and its children are the contract's `icon`.
 */
export type ModalCloseProps = CloseButtonContractProps &
  Omit<HeroModalCloseProps, keyof CloseButtonContractProps | "children" | "aria-label">;
