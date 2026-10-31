/**
 * Stackra file contract:
 * Purpose: the web `SidePanel.Launcher`: while the panel is closed, a floating bar at the bottom centre of the row with
 *          a button that opens the panel (its `title` and `icon`), an optional slot (an input) and `actions`.
 * Boundary: generic: it knows nothing of what the panel holds. It is gone while the panel is open or expanded, and focus
 *           comes back to its button when the panel closes and there is no other opener to return to. Centred with
 *           logical insets, so it stays centred in right-to-left.
 * Runtime: browser
 * Governing contract: ADR 0305; ADR 0060; WCAG 2.2 SC 2.4.3 and 2.5.8; owner request 2026-10-29 (STA-1371, side
 *          panel).
 */
import { cn } from "@heroui/react";
import type { ReactElement } from "react";

import { Button } from "#react/button/button";
import type { SidePanelLauncherProps } from "#react/side-panel/side-panel-launcher.props";
import { useSidePanel } from "#react/side-panel/use-side-panel";
import { SlotIcon } from "#react/slot-icon/slot-icon";

/** The floating bar that opens a closed panel. */
export function SidePanelLauncher({
  title,
  icon,
  children,
  actions,
  className,
  ...rest
}: SidePanelLauncherProps): ReactElement | null {
  const { state, setState, panelId } = useSidePanel();
  if (state !== "closed") return null;
  return (
    <div
      {...rest}
      data-slot="side-panel-launcher"
      data-side-panel-launcher={panelId}
      className={cn(
        "absolute inset-x-0 bottom-4 z-(--z-dock) mx-auto flex w-max max-w-[calc(100%-2rem)] items-center gap-2",
        "rounded-[var(--radius-container)] border border-separator bg-overlay p-1.5 shadow-overlay",
        className,
      )}
    >
      <Button
        variant="ghost"
        size="sm"
        aria-controls={panelId}
        aria-expanded={false}
        onPress={() => setState("open")}
        className="shrink-0"
      >
        {icon === undefined ? null : <SlotIcon icon={icon} />}
        {title}
      </Button>
      {children === undefined ? null : <div className="min-w-0 flex-1">{children}</div>}
      {actions === undefined ? null : (
        <div className="flex shrink-0 items-center gap-1">{actions}</div>
      )}
    </div>
  );
}
