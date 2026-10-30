/**
 * Stackra file contract:
 * Purpose: the web `AngleSlider`: a dial for an angle from 0 to 359 degrees. A drag or press anywhere on the dial points
 *          the hand there; the thumb is a `slider` that steps with the arrow keys (Shift and Page Up/Down fifteen steps,
 *          Home and End the ends) and speaks "45 degrees" in the customer's digits; optional ticks at the quarters.
 * Boundary: SVG drawn in theme colours, with the value and label in HTML. Angles are absolute, so the dial is not
 *           mirrored in Arabic and → always turns clockwise. The angle maths is the shared `angleOfPoint`,
 *           `snapAngle` and `angleOfKey`. Nothing animates, so reduced motion has nothing to drop.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); WAI-ARIA APG slider; WCAG 2.2 SC 2.1.1, 2.5.7 and 4.1.2; STA-1371 (wave
 *          D, owner approval 2026-10-30).
 */
import { cn } from "@heroui/react";
import { useId, useRef, useState, type PointerEvent, type ReactElement } from "react";

import { angleOfKey } from "#core/functions/angle-of-key.function";
import { angleOfPoint } from "#core/functions/angle-of-point.function";
import { snapAngle } from "#core/functions/snap-angle.function";
import type { AngleSliderProps } from "#react/angle-slider/angle-slider.props";
import { useNumberFormat } from "#react/hooks/use-number-format";

/** The drawing box, the ring's radius and the quarter ticks' angles. */
const BOX = 100;
const RADIUS = 42;
const QUARTERS = [0, 90, 180, 270] as const;

/** A point on the ring at `angle` degrees clockwise from the top, at `reach` from the centre. */
const pointAt = (angle: number, reach: number) => {
  const radians = (angle * Math.PI) / 180;
  return { x: BOX / 2 + reach * Math.sin(radians), y: BOX / 2 - reach * Math.cos(radians) };
};

/** An angle set on a dial. */
export function AngleSlider({
  value,
  defaultValue = 0,
  onChange,
  step = 1,
  label,
  hasMarks = false,
  size = 160,
  isDisabled = false,
  className,
}: AngleSliderProps): ReactElement {
  const format = useNumberFormat();
  const labelId = useId();
  const thumb = useRef<HTMLDivElement>(null);
  const [own, setOwn] = useState(() => snapAngle(defaultValue, step));
  const angle = value === undefined ? own : snapAngle(value, step);
  const change = (next: number) => {
    if (next === angle) return;
    if (value === undefined) setOwn(next);
    onChange?.(next);
  };
  const pointTo = (event: PointerEvent<HTMLDivElement>) => {
    const box = event.currentTarget.getBoundingClientRect();
    const dx = event.clientX - (box.left + box.width / 2);
    const dy = event.clientY - (box.top + box.height / 2);
    change(snapAngle(angleOfPoint(dx, dy), step));
  };
  const tip = pointAt(angle, RADIUS);
  return (
    <div
      data-slot="angle-slider"
      className={cn(
        "inline-flex flex-col items-center gap-2",
        isDisabled && "opacity-50",
        className,
      )}
    >
      <span id={labelId} className="text-sm font-medium">
        {label}
      </span>
      <div
        data-slot="angle-slider-dial"
        className={cn("relative touch-none select-none", !isDisabled && "cursor-pointer")}
        style={{ width: size, height: size }}
        onPointerDown={(event) => {
          if (isDisabled || event.button !== 0) return;
          event.currentTarget.setPointerCapture(event.pointerId);
          pointTo(event);
          // The press moved the hand; the thumb takes focus so the keys go on from there.
          thumb.current?.focus({ preventScroll: true });
          event.preventDefault();
        }}
        onPointerMove={(event) => {
          if (event.currentTarget.hasPointerCapture(event.pointerId)) pointTo(event);
        }}
      >
        <svg viewBox={`0 0 ${BOX} ${BOX}`} className="size-full" aria-hidden="true">
          <circle
            cx={BOX / 2}
            cy={BOX / 2}
            r={RADIUS}
            fill="var(--surface)"
            stroke="var(--border)"
            strokeWidth={6}
          />
          {hasMarks
            ? QUARTERS.map((quarter) => {
                const from = pointAt(quarter, RADIUS - 2);
                const to = pointAt(quarter, RADIUS + 2);
                return (
                  <line
                    key={quarter}
                    x1={from.x}
                    y1={from.y}
                    x2={to.x}
                    y2={to.y}
                    stroke="var(--muted)"
                    strokeWidth={1.5}
                    strokeLinecap="round"
                  />
                );
              })
            : null}
          <line
            x1={BOX / 2}
            y1={BOX / 2}
            x2={tip.x}
            y2={tip.y}
            stroke="var(--accent)"
            strokeWidth={2.5}
            strokeLinecap="round"
          />
          <circle cx={BOX / 2} cy={BOX / 2} r={3} fill="var(--accent)" />
        </svg>
        <div
          ref={thumb}
          role="slider"
          tabIndex={isDisabled ? -1 : 0}
          aria-labelledby={labelId}
          aria-valuemin={0}
          aria-valuemax={359}
          aria-valuenow={angle}
          aria-valuetext={format(angle, { style: "unit", unit: "degree", unitDisplay: "long" })}
          aria-disabled={isDisabled || undefined}
          className="absolute size-5 -translate-x-1/2 -translate-y-1/2 border-2 border-background bg-accent shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-focus"
          // Physical left and top on purpose: the dial is not mirrored in right-to-left.
          style={{ left: `${tip.x}%`, top: `${tip.y}%`, borderRadius: "var(--radius-full)" }}
          onKeyDown={(event) => {
            if (isDisabled) return;
            const next = angleOfKey(event.key, angle, step, event.shiftKey);
            if (next === undefined) return;
            event.preventDefault();
            change(next);
          }}
        />
      </div>
      <span aria-hidden="true" className="text-sm font-semibold tabular-nums">
        {format(angle, { style: "unit", unit: "degree", unitDisplay: "narrow" })}
      </span>
    </div>
  );
}
