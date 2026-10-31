/**
 * Stackra file contract:
 * Purpose: the web `HoverCard`: a non-modal HeroUI popover that opens after a short hover or on keyboard focus of the
 *          trigger, stays open while the pointer is over the trigger or the card, and closes on Escape or leaving.
 * Boundary: the card never takes focus, so the trigger keeps its own action (a link still goes on Enter); the
 *           content is hoverable, dismissable and persistent as WCAG 1.4.13 asks.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0165 (web); WCAG 2.2 SC 1.4.13; STA-1371.
 */
import { cn, Popover as HeroPopover } from "@heroui/react";
import { type ReactElement, useEffect, useRef, useState } from "react";

import { reactAriaPlacementOf } from "#core/functions/react-aria-placement-of.function";
import type { HoverCardProps } from "#react/hover-card/hover-card.props";

/** A preview card on hover or focus. */
export function HoverCard({
  trigger,
  children,
  label,
  // oxlint-disable-next-line stackra/no-literal-duration -- hover intent wait before opening, not motion
  openDelay = 500,
  // oxlint-disable-next-line stackra/no-literal-duration -- grace period before closing, not motion
  closeDelay = 200,
  placement = "bottom",
  align,
  className,
}: HoverCardProps): ReactElement {
  const [isOpen, setOpen] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);
  const later = (next: boolean, delay: number) => {
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setOpen(next), delay);
  };
  const keep = () => clearTimeout(timer.current);
  const leave = () => later(false, closeDelay);
  return (
    // oxlint-disable-next-line jsx-a11y/no-static-element-interactions -- reason: a layout-free wrapper that follows hover and focus of the trigger inside it; it is not a control
    <span
      className="inline-flex"
      onPointerEnter={(event) => event.pointerType === "mouse" && later(true, openDelay)}
      onPointerLeave={(event) => event.pointerType === "mouse" && leave()}
      onFocus={() => later(true, 0)}
      onBlur={leave}
      onKeyDown={(event) => event.key === "Escape" && setOpen(false)}
    >
      <HeroPopover isOpen={isOpen} onOpenChange={setOpen}>
        {trigger}
        <HeroPopover.Content isNonModal placement={reactAriaPlacementOf(placement, align)}>
          <HeroPopover.Dialog aria-label={label}>
            <div onPointerEnter={keep} onPointerLeave={leave} className={cn("max-w-xs", className)}>
              {children}
            </div>
          </HeroPopover.Dialog>
        </HeroPopover.Content>
      </HeroPopover>
    </span>
  );
}
