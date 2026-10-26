/**
 * Stackra file contract:
 * Purpose: `Sidebar.Rail` on HeroUI Pro's `Sidebar.Rail`: maps the contract's `label` to `aria-label`.
 * Boundary: no behaviour of its own; the button props are HeroUI Pro's, passed through.
 * Runtime: browser
 * Governing contract: ADR 0310 (decision 4); ADR 0303 (decision 7); STA-403 FR-005.
 */
import {
  Sidebar as HeroSidebar,
  type SidebarRailProps as HeroSidebarRailProps,
} from "@heroui-pro/react/sidebar";

import type { SidebarRailContractProps } from "#contracts/types/sidebar-contract-props.type";
import { UI_PRO_KEYS } from "#core/constants/ui-pro-keys.constant";
import { useUiProText } from "#core/hooks/use-ui-pro-text";

/** Props of the sidebar rail: the shared contract plus HeroUI Pro's own, with `aria-label` renamed `label`. */
export type SidebarRailProps = SidebarRailContractProps &
  Omit<HeroSidebarRailProps, keyof SidebarRailContractProps | "aria-label">;

/** The edge strip of the sidebar that toggles it open and closed when pressed. */
export function SidebarRail({ label, ...rest }: SidebarRailProps) {
  const t = useUiProText();
  return <HeroSidebar.Rail {...rest} aria-label={label || t(UI_PRO_KEYS.ui_pro.sidebar.toggle)} />;
}
