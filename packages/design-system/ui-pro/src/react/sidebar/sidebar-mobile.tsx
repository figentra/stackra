/**
 * Stackra file contract:
 * Purpose: `Sidebar.Mobile` on HeroUI Pro's `Sidebar.Mobile`: names the sheet's dialog from the contract's `label`.
 * Boundary: HeroUI Pro's sheet dialog has no accessible name and `Sidebar.Mobile` passes its props to an inner `div`,
 *          so the name is a visually hidden `Sheet.Heading` (the dialog's `title` slot) placed before the children.
 *          Everything else is HeroUI Pro's, passed through. One rule is added (`SHEET_FILL_CSS`): HeroUI Pro's sheet
 *          draws an opaque off-screen `::after` that axe cannot compute contrast behind, and `Sidebar.Mobile` gives
 *          no way to class the sheet content, so a `<style>` rendered with the sheet drops it.
 * Runtime: browser
 * Governing contract: ADR 0310 (decision 4); ADR 0303 (decision 7); STA-403 FR-005.
 */
import { Sheet } from "@heroui-pro/react/sheet";
import {
  Sidebar as HeroSidebar,
  type SidebarMobileProps as HeroSidebarMobileProps,
} from "@heroui-pro/react/sidebar";

import type { SidebarMobileContractProps } from "#contracts/types/sidebar-contract-props.type";
import { HIDDEN_TEXT_STYLE } from "#react/sidebar/sidebar-hidden-text-style";

// HeroUI Pro removes this off-screen, pointer-events-none fill for detached sheets (`[data-sheet-detached]:after`) but
// `Sidebar.Mobile` has no option, and axe reports its contrast as incomplete; the selector outweighs Pro's unlayered one.
// shortcut: the fill that hides the gap while the sheet is dragged past its edge is gone, re-check at each HeroUI Pro bump
const SHEET_FILL_CSS =
  ".sidebar__mobile-sheet[data-sheet-drawer]:not([data-sheet-custom-container=true])::after{content:none}";

/** Props of the mobile sidebar: the shared contract plus HeroUI Pro's own. */
export type SidebarMobileProps = SidebarMobileContractProps &
  Omit<HeroSidebarMobileProps, keyof SidebarMobileContractProps>;

/** The sheet that replaces the sidebar on a narrow viewport, a dialog named by `label`. */
export function SidebarMobile({ label, children, ...rest }: SidebarMobileProps) {
  return (
    <HeroSidebar.Mobile {...rest}>
      <style>{SHEET_FILL_CSS}</style>
      <Sheet.Heading style={HIDDEN_TEXT_STYLE}>{label}</Sheet.Heading>
      {children}
    </HeroSidebar.Mobile>
  );
}
