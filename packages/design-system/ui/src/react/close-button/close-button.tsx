/**
 * Stackra file contract:
 * Purpose: the web `CloseButton` on HeroUI v3's CloseButton: the dismiss control, named by the required `label`
 *          instead of HeroUI's English default.
 * Boundary: no styling of its own; the overlay that owns it decides what closing does.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0303 (decision 7); ADR 0165 (UI contract).
 */
import {
  CloseButton as HeroCloseButton,
  type CloseButtonProps as HeroCloseButtonProps,
} from "@heroui/react";

import type { CloseButtonContractProps } from "#contracts/types/close-button-contract-props.type";
import { omitUndefined } from "#core/functions/omit-undefined.function";

/**
 * Props of the web CloseButton: the shared contract plus HeroUI v3's own close-button props, passed through. HeroUI's
 * `aria-label` is the contract's `label`, and its children are the contract's `icon`.
 */
export type CloseButtonProps = CloseButtonContractProps &
  Omit<HeroCloseButtonProps, keyof CloseButtonContractProps | "children" | "aria-label">;

/** The dismiss button. Without an `icon` it draws HeroUI's close mark. */
export function CloseButton({ label, icon, isDisabled, onPress, ...rest }: CloseButtonProps) {
  return (
    <HeroCloseButton {...rest} {...omitUndefined({ isDisabled, onPress })} aria-label={label}>
      {icon}
    </HeroCloseButton>
  );
}
