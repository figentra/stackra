/**
 * Stackra file contract:
 * Purpose: `SchedulerEventChip`, one event of the web Scheduler: a soft block in the event's tone with a coloured start
 *          edge, its title and time (one line when compact), named "title, time"; a button when it can be pressed.
 * Boundary: internal; placement is the caller's (`style`). Colours are the tone's token classes.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0060 (right-to-left); WCAG 2.2 SC 2.4.7 and 4.1.2; STA-1371.
 */
import { cn } from "@heroui/react";
import type { ReactElement } from "react";

import { MARKER_TONE_CLASS_NAME } from "#core/constants/marker-tone-class-name.constant";
import type { SchedulerEventChipProps } from "#react/scheduler/scheduler-event-chip.props";

/** One event. */
export function SchedulerEventChip({
  event,
  state,
  onPress,
  isCompact = false,
  style,
}: SchedulerEventChipProps): ReactElement {
  const className = cn(
    "flex min-w-0 overflow-hidden rounded-[var(--radius-control-inner)] border-s-2 border-current px-1.5 text-start text-xs leading-tight outline-none",
    MARKER_TONE_CLASS_NAME[event.tone ?? "accent"],
    isCompact ? "items-center gap-1 py-0.5" : "size-full flex-col py-1",
    onPress && "cursor-pointer hover:brightness-95 focus-visible:ring-2 focus-visible:ring-focus",
  );
  const body = (
    <>
      <span className="truncate font-medium">{event.title}</span>
      <span className={cn("truncate tabular-nums opacity-80", isCompact && "hidden")}>
        {state.timeOf(event)}
      </span>
    </>
  );
  const chip = onPress ? (
    <button
      type="button"
      aria-label={state.nameOf(event)}
      className={className}
      onClick={() => onPress(event)}
    >
      {body}
    </button>
  ) : (
    <div role="group" aria-label={state.nameOf(event)} className={className}>
      {body}
    </div>
  );
  return style ? (
    <div className="absolute p-px" style={style}>
      {chip}
    </div>
  ) : (
    chip
  );
}
