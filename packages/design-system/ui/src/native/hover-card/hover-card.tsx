/**
 * Stackra file contract:
 * Purpose: the native `HoverCard`: nothing hovers on a touch screen, so the preview opens when the trigger is pressed,
 *          in the design system's `Popover`, and closes on a press outside.
 * Boundary: the delays are web-only and unread here; the trigger's own press is replaced by opening the preview.
 * Runtime: react-native
 * Governing contract: ADR 0302 (decision 3: one API on web and native); STA-1371.
 */
import type { ReactElement } from "react";

import type { HoverCardProps } from "#native/hover-card/hover-card.props";
import { Popover } from "#native/popover/popover";

/** A preview card on press. */
export function HoverCard({
  trigger,
  children,
  label,
  placement = "bottom",
  align,
  className,
}: HoverCardProps): ReactElement {
  return (
    <Popover
      trigger={trigger}
      placement={placement}
      {...(align ? { align } : {})}
      accessibilityLabel={label}
      {...(className ? { className } : {})}
    >
      {children}
    </Popover>
  );
}
