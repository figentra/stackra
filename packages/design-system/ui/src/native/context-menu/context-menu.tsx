/**
 * Stackra file contract:
 * Purpose: the native `ContextMenu`: the design system's `Menu`, opened by a long press on its area, with a light
 *          haptic as it opens. A tap does nothing, so the area's own buttons keep working.
 * Boundary: the area is a `Pressable` whose long press opens the menu anchored to it; screen-reader users reach the
 *           same menu from the area's "long press" action, named by `label`. With `isDisabled` nothing opens.
 * Runtime: react-native
 * Governing contract: ADR 0302 (decision 3); ADR 0312 (native); WCAG 2.2 SC 2.5.1; STA-1371 (wave C).
 */
import { useState, type ReactElement } from "react";
import { Pressable } from "react-native";

import type { ContextMenuProps } from "#native/context-menu/context-menu.props";
import { haptics } from "#native/haptics/haptics";
import { Menu } from "#native/menu/menu";

/** A long-press menu over an area. */
export function ContextMenu({
  children,
  sections,
  label,
  onAction,
  isDisabled = false,
  className,
}: ContextMenuProps): ReactElement {
  const [isOpen, setOpen] = useState(false);
  const open = () => {
    if (isDisabled) return;
    haptics.play("impact");
    setOpen(true);
  };
  return (
    <Menu
      sections={sections}
      isOpen={isOpen}
      // The trigger's own tap asks to open too; only the long press may.
      onOpenChange={(next) => (next ? undefined : setOpen(false))}
      {...(onAction ? { onAction } : {})}
    >
      <Pressable
        onLongPress={open}
        accessibilityActions={isDisabled ? [] : [{ name: "longpress", label }]}
        onAccessibilityAction={(event) =>
          event.nativeEvent.actionName === "longpress" ? open() : undefined
        }
        {...(className === undefined ? {} : { className })}
      >
        {children}
      </Pressable>
    </Menu>
  );
}
