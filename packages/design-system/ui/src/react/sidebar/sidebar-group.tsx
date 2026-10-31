/**
 * Stackra file contract:
 * Purpose: the web `Sidebar.Group`: a block of a sidebar's menus under a small heading, with an optional action at the
 *          heading's end. A folding group's heading is a button that shows or hides the block (`aria-expanded`). In the
 *          icon rail the heading becomes a thin rule, stays the group's spoken name, and the group is always open so
 *          every place keeps its icon.
 * Boundary: a `div` with `role="group"` named by its heading. The block is kept in the page while folded (`hidden`),
 *           so an active entry inside can still be found.
 * Runtime: browser
 * Governing contract: ADR 0305; WCAG 2.2 SC 1.3.1, 2.5.8 and 4.1.2; owner request 2026-10-29 (STA-1371).
 */
import { cn } from "@heroui/react";
import { use, useId, useState, type ReactElement } from "react";
import { Button as AriaButton } from "react-aria-components";

import { omitUndefined } from "#core/functions/omit-undefined.function";
import { Icon } from "#react/icon/icon";
import { SidebarContext } from "#react/sidebar/sidebar-context";
import type { SidebarGroupProps } from "#react/sidebar/sidebar-group.props";

/** A labelled block of menus. */
export function SidebarGroup({
  label,
  action,
  isCollapsible = false,
  isOpen,
  defaultOpen = true,
  onOpenChange,
  children,
  className,
  ...rest
}: SidebarGroupProps): ReactElement {
  const isRail = use(SidebarContext)?.isRail ?? false;
  const labelId = useId();
  const bodyId = useId();
  const [ownOpen, setOwnOpen] = useState(defaultOpen);
  const open = isRail || !isCollapsible || (isOpen ?? ownOpen);
  const setOpen = (next: boolean) => {
    setOwnOpen(next);
    onOpenChange?.(next);
  };
  const heading = "text-xs font-medium text-muted";
  return (
    <div
      {...rest}
      role="group"
      {...omitUndefined({ "aria-labelledby": label === undefined ? undefined : labelId })}
      data-slot="sidebar-group"
      className={cn("flex flex-col gap-0.5 py-1", className)}
    >
      {label === undefined ? null : isRail ? (
        <>
          <hr
            aria-hidden="true"
            data-slot="sidebar-group-rule"
            className="mx-3 my-1.5 border-0 border-t border-separator"
          />
          <span id={labelId} className="sr-only">
            {label}
          </span>
        </>
      ) : (
        <div className="flex min-h-8 items-center gap-1 ps-3 pe-1">
          {isCollapsible ? (
            <AriaButton
              id={labelId}
              aria-expanded={open}
              aria-controls={bodyId}
              data-sidebar-focus=""
              onPress={() => setOpen(!open)}
              className={
                cn(
                  heading,
                  "-ms-2 flex min-h-6 flex-1 items-center gap-1 rounded-[var(--radius-control)] px-2 text-start outline-none",
                  "hover:text-foreground focus-visible:[outline-style:var(--focus-ring-style)] focus-visible:outline-(length:--focus-ring-width) focus-visible:outline-focus",
                ) ?? ""
              }
            >
              <span className="min-w-0 flex-1 truncate">{label}</span>
              <Icon
                name="chevron-down"
                className={cn(
                  "size-3.5 shrink-0 transition-transform motion-reduce:transition-none",
                  open ? "" : "-rotate-90 rtl:rotate-90",
                )}
              />
            </AriaButton>
          ) : (
            <span id={labelId} className={cn(heading, "min-w-0 flex-1 truncate")}>
              {label}
            </span>
          )}
          {action === undefined || action === null ? null : (
            <span className="flex shrink-0 items-center">{action}</span>
          )}
        </div>
      )}
      <div id={bodyId} hidden={!open} className="flex flex-col gap-0.5">
        {children}
      </div>
    </div>
  );
}
