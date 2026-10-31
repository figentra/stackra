/**
 * Stackra file contract:
 * Purpose: the web `UndoCountdown`, the undo toast's indicator: an undo arrow inside a ring that empties over the
 *          toast's timeout, so the reader sees how long is left to take the change back.
 * Boundary: internal, not in the `react` barrel; `toast.undo` puts it in the toast's indicator slot. Decorative
 *           (`aria-hidden`): the toast's own message and button carry the meaning. The ring stops while the pointer or
 *           focus is in the toast region, as HeroUI stops the timer then, and resumes when they leave. It drains on the
 *           Web Animations API (no keyframes in shared CSS); at the `none` motion level it stays full.
 * Runtime: browser
 * Governing contract: ADR 0329 (motion); WCAG 2.2 SC 2.2.1; STA-1371 (owner request 2026-10-29).
 */
import { useEffect, useRef, type ReactElement } from "react";

import { useMotion } from "#react/design-system-provider/use-motion";
import { Icon } from "#react/icon/icon";
import type { UndoCountdownProps } from "#react/toast/undo-countdown.props";

/** The ring's circumference, for a radius of 10 in a 24-unit box. */
const RING = 2 * Math.PI * 10;

/** The countdown ring around an undo arrow. */
export function UndoCountdown({ duration }: UndoCountdownProps): ReactElement {
  const motion = useMotion();
  const ring = useRef<SVGCircleElement | null>(null);
  useEffect(() => {
    const element = ring.current;
    if (!element || motion === "none" || typeof element.animate !== "function") return undefined;
    const drain = element.animate([{ strokeDashoffset: 0 }, { strokeDashoffset: RING }], {
      duration,
      // oxlint-disable-next-line stackra/no-literal-duration -- the ring drains in step with the toast timer, so it must stay linear
      easing: "linear",
      fill: "forwards",
    });
    const region = element.closest("[data-slot='toast-region']");
    const pause = () => drain.pause();
    const play = () => {
      if (!region?.matches(":hover, :focus-within")) drain.play();
    };
    region?.addEventListener("pointerenter", pause);
    region?.addEventListener("focusin", pause);
    region?.addEventListener("pointerleave", play);
    region?.addEventListener("focusout", play);
    return () => {
      drain.cancel();
      region?.removeEventListener("pointerenter", pause);
      region?.removeEventListener("focusin", pause);
      region?.removeEventListener("pointerleave", play);
      region?.removeEventListener("focusout", play);
    };
  }, [duration, motion]);
  return (
    <span aria-hidden className="relative inline-flex size-6 items-center justify-center">
      <svg viewBox="0 0 24 24" className="absolute inset-0 size-6 -rotate-90">
        <circle cx="12" cy="12" r="10" fill="none" strokeWidth="2" className="stroke-separator" />
        <circle
          ref={ring}
          cx="12"
          cy="12"
          r="10"
          fill="none"
          strokeWidth="2"
          strokeLinecap="round"
          strokeDasharray={RING}
          className="stroke-accent"
        />
      </svg>
      <Icon name="undo-2" size="sm" isMirroredInRtl className="size-3" />
    </span>
  );
}
