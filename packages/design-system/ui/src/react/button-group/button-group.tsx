/**
 * Stackra file contract:
 * Purpose: the web `ButtonGroup` on HeroUI v3's ButtonGroup: the caller's Buttons attached into one control with
 *          shared size, variant and disabled state, the outer corners on the control radius.
 * Boundary: a `group` named by `label`; each button keeps its own name and focus. The ends follow the reading
 *           direction, so the group mirrors in right-to-left.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0060 (right-to-left); WCAG 2.2 SC 1.3.1 and 4.1.2; STA-1371.
 */
import { ButtonGroup as HeroButtonGroup, cn } from "@heroui/react";
import type { ReactElement } from "react";

import { omitUndefined } from "#core/functions/omit-undefined.function";
import type { ButtonGroupProps } from "#react/button-group/button-group.props";

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
    <HeroButtonGroup
      aria-label={label}
      orientation={orientation}
      variant={variant === "glass" ? "ghost" : variant}
      {...omitUndefined({ size, isDisabled })}
      className={cn("[--radius:var(--radius-control)]", className) ?? ""}
    >
      {children}
    </HeroButtonGroup>
  );
}
