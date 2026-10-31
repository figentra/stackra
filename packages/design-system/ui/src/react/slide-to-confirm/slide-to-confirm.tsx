/**
 * Stackra file contract:
 * Purpose: the web `SlideToConfirm`: a pill track whose round thumb is dragged with a pointer to the reading end; a fill
 *          follows the thumb and the instruction fades as it goes. Past nine tenths it confirms and stays at the end;
 *          short of that it eases back. The track is a button: Enter or Space confirms at once, the keyboard and
 *          screen-reader path that is also WCAG 2.5.7's single-pointer alternative.
 * Boundary: pointer events with capture, so a drag that leaves the track still tracks; the inline axis follows React
 *           Aria's direction, so in Arabic the thumb starts on the right. Reduced motion drops the ease back.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0329 (motion layer); wave 3c mobile interactions (owner approval
 *          2026-10-28); WCAG 2.2 SC 2.1.1, 2.5.7.
 */
import type { ReactElement } from "react";
import { cn } from "@heroui/react";
import { useLayoutEffect, useRef, useState } from "react";
import { useLocale } from "react-aria-components";

import { Icon } from "#react/icon/icon";
import type { SlideToConfirmProps } from "#react/slide-to-confirm/slide-to-confirm.props";

/** The thumb's size and the track's inner padding, in CSS pixels. */
const THUMB = 48;
const PAD = 4;
/** The share of the travel that confirms on release. */
const CONFIRM_SHARE = 0.9;

/** A thumb the person slides to the end to confirm a weighty action. */
export function SlideToConfirm({
  label,
  confirmedLabel,
  onConfirm,
  isConfirmed,
  variant = "primary",
  isDisabled = false,
  className,
  ...rest
}: SlideToConfirmProps): ReactElement {
  const [ownConfirmed, setOwnConfirmed] = useState(false);
  const confirmed = isConfirmed ?? ownConfirmed;
  const sign = useLocale().direction === "rtl" ? -1 : 1;
  const track = useRef<HTMLDivElement>(null);
  // The pointer's start and how far the thumb has gone toward the reading end, or null while not dragging.
  const [drag, setDrag] = useState<{ start: number; offset: number } | null>(null);
  // The track's width, measured after layout and on every resize.
  const [width, setWidth] = useState(0);
  useLayoutEffect(() => {
    const element = track.current;
    if (!element) return undefined;
    setWidth(element.clientWidth);
    if (typeof ResizeObserver === "undefined") return undefined;
    const observer = new ResizeObserver(() => setWidth(element.clientWidth));
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  const travel = Math.max(width - THUMB - PAD * 2, 0);
  const offset = confirmed ? travel : (drag?.offset ?? 0);
  const share = confirmed ? 1 : offset / Math.max(travel, 1);
  const color = variant === "danger" ? "danger" : "accent";

  const confirm = () => {
    if (confirmed || isDisabled) return;
    setOwnConfirmed(true);
    onConfirm?.();
  };
  const words = confirmed ? (confirmedLabel ?? label) : label;

  return (
    <div
      {...rest}
      ref={track}
      role="button"
      tabIndex={isDisabled ? -1 : 0}
      aria-label={words}
      aria-disabled={isDisabled || undefined}
      aria-pressed={confirmed}
      data-slot="slide-to-confirm"
      onKeyDown={(event) => {
        if (event.key !== "Enter" && event.key !== " ") return;
        event.preventDefault();
        confirm();
      }}
      className={cn(
        "relative flex h-14 touch-pan-y select-none items-center overflow-hidden rounded-[var(--radius-pill)] bg-default outline-none focus-visible:ring-2 focus-visible:ring-focus",
        isDisabled && "opacity-(--disabled-opacity)",
        className,
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          "absolute inset-y-0 start-0 rounded-[var(--radius-pill)] opacity-25",
          color === "danger" ? "bg-danger" : "bg-accent",
        )}
        style={{ width: offset + THUMB + PAD * 2 }}
      />
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 end-4 flex items-center justify-center truncate font-medium"
        style={{ insetInlineStart: THUMB + PAD * 2, opacity: 1 - share }}
      >
        {words}
      </span>
      <span
        aria-hidden="true"
        className={cn(
          "relative flex cursor-grab items-center justify-center rounded-[var(--radius-pill)] active:cursor-grabbing",
          color === "danger"
            ? "bg-danger text-danger-foreground"
            : "bg-accent text-accent-foreground",
          drag === null &&
            "transition-transform duration-[var(--duration-base)] motion-reduce:transition-none",
        )}
        style={{
          width: THUMB,
          height: THUMB,
          marginInlineStart: PAD,
          transform: `translateX(${offset * sign}px)`,
        }}
        onPointerDown={(event) => {
          if (confirmed || isDisabled) return;
          event.currentTarget.setPointerCapture(event.pointerId);
          setDrag({ start: event.clientX, offset: 0 });
        }}
        onPointerMove={(event) => {
          if (drag === null) return;
          const moved = (event.clientX - drag.start) * sign;
          setDrag({ ...drag, offset: Math.min(Math.max(moved, 0), travel) });
        }}
        onPointerUp={() => {
          if (drag !== null && drag.offset >= travel * CONFIRM_SHARE) confirm();
          setDrag(null);
        }}
        onPointerCancel={() => setDrag(null)}
      >
        <Icon name={confirmed ? "check" : "chevrons-right"} />
      </span>
    </div>
  );
}
