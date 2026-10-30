/**
 * Stackra file contract:
 * Purpose: the native `ButtonGroup`: the caller's Buttons attached into one control, a hairline between them, the
 *          outer corners on the control radius, sharing size, variant and the disabled state.
 * Boundary: each child Button is handed the shared props and square inner corners (the group clips the outer ones);
 *           the row follows the layout direction, so it mirrors in right-to-left. Named as a group for screen readers.
 * Runtime: react-native
 * Governing contract: ADR 0302 (decision 3); ADR 0060 (right-to-left); WCAG 2.2 SC 4.1.2; STA-1371.
 */
import { Children, cloneElement, isValidElement, type ReactElement } from "react";
import { View } from "react-native";

import type { ButtonGroupProps } from "#native/button-group/button-group.props";

/** Draws buttons joined into one attached row. */
export function ButtonGroup({
  children,
  label,
  orientation = "horizontal",
  size,
  variant = "secondary",
  isDisabled,
  className,
}: ButtonGroupProps): ReactElement {
  return (
    <View
      accessibilityRole="toolbar"
      accessibilityLabel={label}
      className={`${orientation === "vertical" ? "flex-col" : "flex-row"} self-start gap-px overflow-hidden rounded-[var(--radius-control)] bg-default ${className ?? ""}`}
    >
      {Children.map(children, (child) =>
        isValidElement<Record<string, unknown>>(child)
          ? cloneElement(child, {
              variant,
              ...(size ? { size } : {}),
              ...(isDisabled ? { isDisabled } : {}),
              className: `rounded-none ${String(child.props["className"] ?? "")}`,
            })
          : child,
      )}
    </View>
  );
}
