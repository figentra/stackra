/**
 * Stackra file contract:
 * Purpose: the MediaPlayer's `MediaRange`: a thin track with what is loaded, the played fill and a thumb, as one
 *          `slider` that a press or drag moves and the keys step (arrows one step, Page Up/Down ten, Home and End the
 *          ends). Its own keys stop there, so the player's shortcuts do not run twice.
 * Boundary: internal. Always left to right (the player's controls row is): physical left, and → moves forward in every
 *           language, as on YouTube and the system players.
 * Runtime: browser
 * Governing contract: WAI-ARIA APG slider; WCAG 2.2 SC 2.1.1 and 4.1.2; STA-1371 (wave D, owner approval 2026-10-30).
 */
import { cn } from "@heroui/react";
import type { PointerEvent, ReactElement } from "react";

import { mediaShareOf } from "#core/functions/media-share-of.function";
import type { MediaRangeProps } from "#react/media-player/media-range.props";

/** A full round from the theme's radius token. */
const ROUND = { borderRadius: "var(--radius-full)" } as const;

/** A share of the track as a CSS percentage. */
const percent = (part: number, max: number) => `${mediaShareOf(part, max) * 100}%`;

/** The timeline or the volume of a MediaPlayer. */
export function MediaRange({
  value,
  max,
  buffered,
  label,
  valueText,
  step,
  onChange,
  className,
}: MediaRangeProps): ReactElement {
  const clamp = (next: number) => Math.min(max, Math.max(0, next));
  const pointTo = (event: PointerEvent<HTMLDivElement>) => {
    const box = event.currentTarget.getBoundingClientRect();
    onChange(clamp(((event.clientX - box.left) / (box.width || 1)) * max));
  };
  const keys: Readonly<Record<string, number>> = {
    ArrowRight: value + step,
    ArrowUp: value + step,
    ArrowLeft: value - step,
    ArrowDown: value - step,
    PageUp: value + step * 10,
    PageDown: value - step * 10,
    Home: 0,
    End: max,
  };
  return (
    <div
      role="slider"
      tabIndex={0}
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={max}
      aria-valuenow={value}
      aria-valuetext={valueText}
      aria-orientation="horizontal"
      data-slot="media-range"
      className={cn(
        "group relative flex h-5 cursor-pointer touch-none items-center outline-none focus-visible:ring-2 focus-visible:ring-focus",
        className,
      )}
      onKeyDown={(event) => {
        const next = keys[event.key];
        if (next === undefined) return;
        event.preventDefault();
        event.stopPropagation();
        onChange(clamp(next));
      }}
      onPointerDown={(event) => {
        if (event.button !== 0) return;
        event.currentTarget.setPointerCapture(event.pointerId);
        pointTo(event);
      }}
      onPointerMove={(event) => {
        if (event.currentTarget.hasPointerCapture(event.pointerId)) pointTo(event);
      }}
    >
      <span className="relative h-1 w-full overflow-hidden bg-default" style={ROUND}>
        {buffered === undefined ? null : (
          <span
            className="absolute inset-y-0 left-0 bg-muted/40"
            style={{ width: percent(buffered, max) }}
          />
        )}
        <span
          className="absolute inset-y-0 left-0 bg-accent"
          style={{ width: percent(value, max) }}
        />
      </span>
      <span
        aria-hidden="true"
        className="absolute size-3 -translate-x-1/2 bg-accent shadow-(--raised-shadow)"
        style={{ ...ROUND, left: percent(value, max) }}
      />
    </div>
  );
}
