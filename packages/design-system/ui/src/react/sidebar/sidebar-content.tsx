/**
 * Stackra file contract:
 * Purpose: the web `Sidebar.Content`: the sidebar's one `nav` landmark, the block that scrolls between the header and
 *          the footer. The arrow keys move between its entries (Up and Down, Home and End, wrapping), while Tab still
 *          reaches each one.
 * Boundary: the arrow keys move among the elements marked `data-sidebar-focus` (entries and folding headings) that are
 *           not hidden, inert or disabled; an entry's action is reached by Tab only.
 * Runtime: browser
 * Governing contract: ADR 0305; WCAG 2.2 SC 1.3.1, 2.1.1 and 2.4.3; owner request 2026-10-29 (STA-1371).
 */
import { cn } from "@heroui/react";
import { use, type KeyboardEvent, type ReactElement } from "react";

import { UI_KEYS } from "#core/constants/ui-keys.constant";
import { useUiText } from "#react/hooks/use-ui-text";
import { SidebarContext } from "#react/sidebar/sidebar-context";
import type { SidebarContentProps } from "#react/sidebar/sidebar-content.props";

/** The keys that move focus, and where each moves it from index `at` among `count` stops. */
const MOVES: Readonly<Record<string, (at: number, count: number) => number>> = {
  ArrowDown: (at, count) => (at + 1) % count,
  ArrowUp: (at, count) => (at - 1 + count) % count,
  Home: () => 0,
  End: (_at, count) => count - 1,
};

/** The sidebar's navigation landmark. */
export function SidebarContent({
  label: labelProp,
  className,
  onKeyDown,
  ...rest
}: SidebarContentProps): ReactElement {
  const t = useUiText();
  const isRail = use(SidebarContext)?.isRail ?? false;
  const label = labelProp ?? t(UI_KEYS.ui.navigation_list.label);
  const rove = (event: KeyboardEvent<HTMLElement>) => {
    onKeyDown?.(event);
    const move = MOVES[event.key];
    if (move === undefined || event.defaultPrevented) return;
    if (!(event.target instanceof HTMLElement) || !event.target.matches("[data-sidebar-focus]"))
      return;
    const stops = [
      ...event.currentTarget.querySelectorAll<HTMLElement>("[data-sidebar-focus]"),
    ].filter((stop) => !stop.closest("[hidden],[inert]") && !stop.hasAttribute("data-disabled"));
    const at = stops.indexOf(event.target);
    if (at === -1) return;
    event.preventDefault();
    stops[move(at, stops.length)]?.focus();
  };
  return (
    // oxlint-disable-next-line jsx-a11y/no-noninteractive-element-interactions -- reason: the arrow keys rove between the links inside the nav; the nav itself is not a control
    <nav
      {...rest}
      aria-label={label}
      data-slot="sidebar-content"
      onKeyDown={rove}
      className={cn(
        // `px-2` keeps an entry's focus ring from being cut by the scrolling box.
        "flex min-h-0 flex-1 flex-col gap-1 overflow-x-hidden overflow-y-auto px-2 py-1",
        // The first group's rule in the rail would sit straight under the header.
        "[&>[data-slot=sidebar-group]:first-child>[data-slot=sidebar-group-rule]]:hidden",
        isRail ? "items-stretch" : "",
        className,
      )}
    />
  );
}
