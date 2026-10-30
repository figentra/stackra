/**
 * Stackra file contract:
 * Purpose: the web `Sidebar.Trigger`: the button that collapses and expands the nearest sidebar, or opens its drawer
 *          below the mobile breakpoint. Its icon and spoken name follow the state unless given, and it reports the
 *          state with `aria-expanded` and names the panel with `aria-controls`.
 * Boundary: an IconButton reading `useSidebar`, so it works anywhere inside a `SidebarProvider` (a page header) and
 *           inside a Sidebar. The panel icon is directional, so it mirrors in right-to-left with the sidebar.
 * Runtime: browser
 * Governing contract: ADR 0305; WCAG 2.2 SC 2.5.8 and 4.1.2; owner request 2026-10-29 (STA-1371).
 */
import type { ReactElement } from "react";

import { UI_KEYS } from "#core/constants/ui-keys.constant";
import { useUiText } from "#react/hooks/use-ui-text";
import { IconButton } from "#react/icon-button/icon-button";
import type { SidebarTriggerProps } from "#react/sidebar/sidebar-trigger.props";
import { useSidebar } from "#react/sidebar/use-sidebar";

/** The sidebar's toggle. */
export function SidebarTrigger({
  icon,
  label,
  onPress,
  variant = "ghost",
  ...rest
}: SidebarTriggerProps): ReactElement {
  const t = useUiText();
  const { isMobile, isMobileOpen, isCollapsed, toggle, panelId } = useSidebar();
  const isClosed = isMobile ? !isMobileOpen : isCollapsed;
  const ownLabel = isMobile
    ? t(UI_KEYS.ui.sidebar.open)
    : isCollapsed
      ? t(UI_KEYS.ui.sidebar.expand)
      : t(UI_KEYS.ui.sidebar.collapse);
  return (
    <IconButton
      {...rest}
      variant={variant}
      icon={icon ?? (isClosed ? "panel-left-open" : "panel-left-close")}
      label={label ?? ownLabel}
      aria-expanded={!isClosed}
      aria-controls={panelId}
      data-sidebar-trigger=""
      onPress={() => {
        onPress?.();
        toggle();
      }}
    />
  );
}
