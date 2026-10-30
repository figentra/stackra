/**
 * Stackra file contract:
 * Purpose: the web `ContextMenu`: the design system's `Menu`, opened at the pointer on a right-click inside its area,
 *          or at the area's centre on Shift+F10 or the menu key, so keyboard users reach the same actions.
 * Boundary: the menu anchors to an invisible React Aria button moved to the opening point; focus goes into the menu
 *           and returns to the area. With `isDisabled` the browser's own menu opens.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0165 (web); WCAG 2.2 SC 2.1.1; STA-1371.
 */
import { cn } from "@heroui/react";
import { type KeyboardEvent, type MouseEvent, type ReactElement, useRef, useState } from "react";
import { Button as AriaButton } from "react-aria-components";

import type { ContextMenuProps } from "#react/context-menu/context-menu.props";
import { Menu } from "#react/menu/menu";

/** A right-click menu over an area. */
export function ContextMenu({
  children,
  sections,
  label,
  onAction,
  isDisabled = false,
  className,
}: ContextMenuProps): ReactElement {
  const area = useRef<HTMLDivElement>(null);
  const [point, setPoint] = useState<{ readonly x: number; readonly y: number } | null>(null);
  const openAt = (x: number, y: number) => setPoint({ x, y });
  const onContextMenu = (event: MouseEvent<HTMLDivElement>) => {
    if (isDisabled || !area.current) return;
    event.preventDefault();
    const box = area.current.getBoundingClientRect();
    openAt(event.clientX - box.left, event.clientY - box.top);
  };
  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (isDisabled || !area.current) return;
    if (event.key === "ContextMenu" || (event.shiftKey && event.key === "F10")) {
      event.preventDefault();
      openAt(area.current.clientWidth / 2, area.current.clientHeight / 2);
    }
  };
  return (
    // oxlint-disable-next-line jsx-a11y/no-static-element-interactions -- reason: the area only catches the context menu and its keyboard shortcut bubbling from the content inside; it is not a control
    <div
      ref={area}
      data-slot="context-menu"
      className={cn("relative", className)}
      onContextMenu={onContextMenu}
      onKeyDown={onKeyDown}
    >
      {children}
      <Menu
        sections={sections}
        isOpen={point !== null}
        onOpenChange={(isOpen) => (isOpen ? undefined : setPoint(null))}
        placement="bottom"
        align="start"
        {...(onAction ? { onAction } : {})}
      >
        <AriaButton
          aria-label={label}
          excludeFromTabOrder
          className="pointer-events-none absolute size-px opacity-0"
          style={{ left: point?.x ?? 0, top: point?.y ?? 0 }}
        />
      </Menu>
    </div>
  );
}
