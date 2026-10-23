/**
 * Stackra file contract:
 * Purpose: `AppLayout.MenuToggle` on HeroUI Pro's `AppLayout.MenuToggle`: maps the contract's `label` to `aria-label`.
 * Boundary: no behaviour of its own; the button, tooltip and icon props are HeroUI Pro's, passed through.
 * Runtime: browser
 * Governing contract: ADR 0304 (decision 3); ADR 0303 (decision 7); STA-403 FR-005.
 */
import {
  AppLayout as HeroAppLayout,
  type AppLayoutMenuToggleProps as HeroAppLayoutMenuToggleProps,
} from "@heroui-pro/react/app-layout";

import type { AppLayoutMenuToggleContractProps } from "#contracts/types/app-layout-contract-props.type";

/** Props of the menu toggle: the shared contract plus HeroUI Pro's own, with `aria-label` renamed `label`. */
export type AppLayoutMenuToggleProps = AppLayoutMenuToggleContractProps &
  Omit<HeroAppLayoutMenuToggleProps, keyof AppLayoutMenuToggleContractProps | "aria-label">;

/** The button that opens the mobile navigation sheet. */
export function AppLayoutMenuToggle({ label, ...rest }: AppLayoutMenuToggleProps) {
  return <HeroAppLayout.MenuToggle {...rest} {...(label ? { "aria-label": label } : {})} />;
}
