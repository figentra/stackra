/**
 * Stackra file contract:
 * Purpose: `AppLayout.MenuToggle` on HeroUI Pro's `AppLayout.MenuToggle`: maps the contract's `label` to `aria-label`.
 * Boundary: no behaviour of its own; the button, tooltip and icon props are HeroUI Pro's, passed through.
 * Runtime: browser
 * Governing contract: ADR 0310 (decision 4); ADR 0303 (decision 7); STA-403 FR-005.
 */
import { AppLayout as HeroAppLayout } from "@heroui-pro/react/app-layout";

import type { AppLayoutMenuToggleProps } from "#react/app-layout/app-layout-menu-toggle.props";

/** The button that opens the mobile navigation sheet. */
export function AppLayoutMenuToggle({ label, ...rest }: AppLayoutMenuToggleProps) {
  return <HeroAppLayout.MenuToggle {...rest} {...(label ? { "aria-label": label } : {})} />;
}
