/**
 * Stackra file contract:
 * Purpose: the web `SidePanel.Header`: the panel's top row. Its children sit at the start (a title, a menu of recent
 *          items); at the end come the panel's own `actions`, then the built-in expand button (a toggle: pressed while
 *          expanded, its icon turning from expand to collapse) and the close button.
 * Boundary: the expand button is hidden while the panel is a drawer (a small screen has no room to expand into). The
 *           buttons' names come from the `ui` catalogue.
 * Runtime: browser
 * Governing contract: ADR 0305; WAI-ARIA button (toggle); WCAG 2.2 SC 4.1.2; owner request 2026-10-29 (STA-1371, side
 *          panel).
 */
import { cn } from "@heroui/react";
import type { ReactElement } from "react";

import { UI_KEYS } from "#core/constants/ui-keys.constant";
import { useUiText } from "#react/hooks/use-ui-text";
import { IconButton } from "#react/icon-button/icon-button";
import type { SidePanelHeaderProps } from "#react/side-panel/side-panel-header.props";
import { useSidePanel } from "#react/side-panel/use-side-panel";

/** The panel's top row. */
export function SidePanelHeader({
  children,
  actions,
  isExpandable = true,
  isClosable = true,
  className,
  ...rest
}: SidePanelHeaderProps): ReactElement {
  const t = useUiText();
  const { state, setState, isDrawer, panelId } = useSidePanel();
  const isExpanded = state === "expanded";
  return (
    <div
      {...rest}
      data-slot="side-panel-header"
      className={cn(
        "flex min-h-14 shrink-0 items-center gap-2 border-b border-separator px-3 py-2",
        className,
      )}
    >
      <div className="flex min-w-0 flex-1 items-center gap-2">{children}</div>
      <div className="flex shrink-0 items-center gap-1">
        {actions}
        {isExpandable && !isDrawer ? (
          <IconButton
            variant="ghost"
            size="sm"
            icon={isExpanded ? "minimize-2" : "maximize-2"}
            label={t(UI_KEYS.ui.side_panel.expand)}
            aria-pressed={isExpanded}
            aria-controls={panelId}
            onPress={() => setState(isExpanded ? "open" : "expanded")}
          />
        ) : null}
        {isClosable ? (
          <IconButton
            variant="ghost"
            size="sm"
            icon="x"
            label={t(UI_KEYS.ui.side_panel.close)}
            onPress={() => setState("closed")}
          />
        ) : null}
      </div>
    </div>
  );
}
