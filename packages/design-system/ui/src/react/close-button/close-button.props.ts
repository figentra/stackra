/**
 * Stackra file contract:
 * Purpose: `CloseButtonProps`, the props of the web `CloseButton` in `close-button.tsx`.
 * Boundary: types only; the component and the `./react` entry import it from here.
 * Runtime: browser
 * Governing contract: ADR 0305 (rules 10 and 12: one declaration per file); ADR 0302 (decision 3); ADR 0303 (decision
 *          7); ADR 0165 (UI contract).
 */
import type { CloseButtonProps as HeroCloseButtonProps } from "@heroui/react";
import type { CloseButtonContractProps } from "#contracts/types/close-button-contract-props.type";

/**
 * Props of the web CloseButton: the shared contract plus HeroUI v3's own close-button props, passed through. HeroUI's
 * `aria-label` is the contract's `label`, and its children are the contract's `icon`.
 */
export type CloseButtonProps = CloseButtonContractProps &
  Omit<HeroCloseButtonProps, keyof CloseButtonContractProps | "children" | "aria-label">;
