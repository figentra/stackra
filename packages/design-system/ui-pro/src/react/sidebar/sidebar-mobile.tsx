/**
 * Stackra file contract:
 * Purpose: `Sidebar.Mobile` on HeroUI Pro's `Sidebar.Mobile`: names the sheet's dialog from the contract's `label`.
 * Boundary: HeroUI Pro's sheet dialog has no accessible name and `Sidebar.Mobile` passes its props to an inner `div`,
 *          so the name is a visually hidden `Sheet.Heading` (the dialog's `title` slot) placed before the children.
 *          Everything else is HeroUI Pro's, passed through.
 * Runtime: browser
 * Governing contract: ADR 0304 (decision 3); ADR 0303 (decision 7); STA-403 FR-005.
 */
import { Sheet } from "@heroui-pro/react/sheet";
import {
  Sidebar as HeroSidebar,
  type SidebarMobileProps as HeroSidebarMobileProps,
} from "@heroui-pro/react/sidebar";

import type { SidebarMobileContractProps } from "#contracts/types/sidebar-contract-props.type";
import { HIDDEN_TEXT_STYLE } from "#react/sidebar/sidebar-hidden-text-style";

/** Props of the mobile sidebar: the shared contract plus HeroUI Pro's own. */
export type SidebarMobileProps = SidebarMobileContractProps &
  Omit<HeroSidebarMobileProps, keyof SidebarMobileContractProps>;

/** The sheet that replaces the sidebar on a narrow viewport, a dialog named by `label`. */
export function SidebarMobile({ label, children, ...rest }: SidebarMobileProps) {
  return (
    <HeroSidebar.Mobile {...rest}>
      <Sheet.Heading style={HIDDEN_TEXT_STYLE}>{label}</Sheet.Heading>
      {children}
    </HeroSidebar.Mobile>
  );
}
