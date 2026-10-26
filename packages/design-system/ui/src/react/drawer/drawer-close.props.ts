/**
 * Stackra file contract:
 * Purpose: `DrawerCloseProps`, the props of the web `DrawerClose` in `drawer-close.tsx`.
 * Boundary: types only; the component and the `./react` entry import it from here.
 * Runtime: browser
 * Governing contract: ADR 0305 (rules 10 and 12: one declaration per file); ADR 0302 (decision 3); ADR 0303 (decision
 *          7); ADR 0312; WCAG 2.2 SC 2.5.8 and 4.1.2.
 */
import type { DrawerCloseTriggerProps as HeroDrawerCloseProps } from "@heroui/react";
import type { CloseButtonContractProps } from "#contracts/types/close-button-contract-props.type";

/**
 * Props of the web Drawer.Close: the close-button contract plus HeroUI v3's own close-trigger props, passed through.
 * HeroUI's `aria-label` is the contract's `label`, and its children are the contract's `icon`.
 */
export type DrawerCloseProps = CloseButtonContractProps &
  Omit<HeroDrawerCloseProps, keyof CloseButtonContractProps | "children" | "aria-label">;
