/**
 * Stackra file contract:
 * Purpose: the web `HoloCard`: a card that tilts toward the pointer in 3D with a soft glare and an iridescent sheen
 *          that follow it, and settles back when the pointer leaves.
 * Boundary: the pointer writes four CSS custom properties through the element's style object (no style tag); the
 *           glare and sheen are decorative layers hidden from assistive technology. Still under reduced motion or
 *           `isStill`.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); WCAG 2.2 SC 2.3.3; STA-1371.
 */
import { cn } from "@heroui/react";
import { useReducedMotion } from "motion/react";
import { type PointerEvent, type ReactElement, useRef } from "react";

import type { HoloCardProps } from "#react/holo-card/holo-card.props";

/** A tilting holographic card. */
export function HoloCard({
  children,
  maxTilt = 10,
  isStill = false,
  className,
}: HoloCardProps): ReactElement {
  const card = useRef<HTMLDivElement>(null);
  const isReduced = useReducedMotion() ?? false;
  const isLive = !isStill && !isReduced;
  const set = (x: number, y: number, isOn: boolean) => {
    const style = card.current?.style;
    if (!style) return;
    style.setProperty("--holo-x", `${x * 100}%`);
    style.setProperty("--holo-y", `${y * 100}%`);
    style.setProperty("--holo-rx", `${(0.5 - y) * 2 * maxTilt}deg`);
    style.setProperty("--holo-ry", `${(x - 0.5) * 2 * maxTilt}deg`);
    style.setProperty("--holo-on", isOn ? "1" : "0");
  };
  const onMove = (event: PointerEvent<HTMLDivElement>) => {
    const box = card.current?.getBoundingClientRect();
    if (!box || box.width === 0) return;
    set((event.clientX - box.left) / box.width, (event.clientY - box.top) / box.height, true);
  };
  return (
    <div className="[perspective:900px]">
      <div
        ref={card}
        data-slot="holo-card"
        onPointerMove={isLive ? onMove : undefined}
        onPointerLeave={isLive ? () => set(0.5, 0.5, false) : undefined}
        className={cn(
          "relative isolate overflow-hidden rounded-[var(--radius-container)] bg-surface shadow-overlay transition-transform duration-(--duration-moderate) ease-out [transform-style:preserve-3d] [transform:rotateX(var(--holo-rx,0deg))_rotateY(var(--holo-ry,0deg))] motion-reduce:transition-none",
          className,
        )}
      >
        {children}
        {isLive ? (
          <>
            <span
              aria-hidden
              className="pointer-events-none absolute inset-0 opacity-[calc(var(--holo-on,0)*0.55)] mix-blend-color-dodge transition-opacity duration-(--duration-slow) [background:conic-gradient(from_180deg_at_var(--holo-x,50%)_var(--holo-y,50%),#ff7ab6,#7af0ff,#b388ff,#7affb2,#ffe07a,#ff7ab6)]"
            />
            <span
              aria-hidden
              className="pointer-events-none absolute inset-0 opacity-[calc(var(--holo-on,0)*0.7)] transition-opacity duration-(--duration-slow) [background:radial-gradient(circle_at_var(--holo-x,50%)_var(--holo-y,50%),rgb(255_255_255/0.45),transparent_55%)]"
            />
          </>
        ) : null}
      </div>
    </div>
  );
}
