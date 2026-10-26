/**
 * Stackra file contract:
 * Purpose: `Sidebar.MenuIcon` on HeroUI Pro's `Sidebar.MenuIcon`: while the sidebar is collapsed to icons, adds the
 *          item's `label` as visually hidden text, which names the icon-only tooltip trigger HeroUI Pro draws there.
 * Boundary: HeroUI Pro wraps only the icon in a `role="button"` tooltip trigger when collapsed and hides the label, so
 *          the trigger has no name (axe `aria-command-name`). Expanded, or in the mobile sheet, nothing is added, as
 *          the label is then drawn beside the icon. Everything else is HeroUI Pro's, passed through.
 * Runtime: browser
 * Governing contract: ADR 0310 (decision 4); ADR 0303 (decision 7); STA-403 FR-005.
 */
import { Sidebar as HeroSidebar, useSidebar } from "@heroui-pro/react/sidebar";

import { HIDDEN_TEXT_STYLE } from "#react/sidebar/sidebar-hidden-text-style";
import type { SidebarMenuIconProps } from "#react/sidebar/sidebar-menu-icon.props";

/** The icon of a menu item, named by `label` while the sidebar shows icons only. */
export function SidebarMenuIcon({ label, children, ...rest }: SidebarMenuIconProps) {
  const { collapsible, isMobile, isOpen } = useSidebar();
  const isIconOnly = collapsible === "icon" && !isMobile && !isOpen;
  return (
    <HeroSidebar.MenuIcon {...rest}>
      {children}
      {isIconOnly && label ? <span style={HIDDEN_TEXT_STYLE}>{label}</span> : null}
    </HeroSidebar.MenuIcon>
  );
}
