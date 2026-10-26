/**
 * Stackra file contract:
 * Purpose: the web `ResourceScheduler`: a day or week of bookings in one column per resource (staff, room or chair)
 *          per day, on a time axis; a booking is dragged to move it in time or to another column, and its bottom edge
 *          is dragged to resize it, both snapped to the step; processing gaps show inside a booking and leave the
 *          resource free, so another booking may sit in them.
 * Boundary: proposes, never saves: a finished drag or key press calls `onEventChange` with the booking as it would
 *           be, and the caller saves or refuses it. Keyboard: each booking is a button; arrows up and down move it by
 *           a step, with Shift they resize it, and arrows left and right move it to the previous or next column in
 *           reading order. Times are the caller's wall-clock minutes; the hours, the week and the step are its data.
 *           HeroUI Pro has no scheduler, so this is the package's own component on its own markup.
 * Runtime: browser
 * Governing contract: ADR 0310 (decision 3); WCAG 2.2 SC 2.1.1 and 2.5.7 (a keyboard way for every drag).
 */
import {
  useId,
  useRef,
  useState,
  type KeyboardEvent,
  type PointerEvent,
  type ReactElement,
} from "react";
import { useLocale } from "react-aria-components";

import type { SchedulerEvent } from "#contracts/types/scheduler-event.type";

import { eventLanes } from "#core/functions/event-lanes.function";
import { moveEvent } from "#core/functions/move-event.function";
import { resizeEvent } from "#core/functions/resize-event.function";
import type { ResourceSchedulerProps } from "#react/resource-scheduler/resource-scheduler.props";

/** A drag in progress. */
interface Drag {
  readonly id: string;
  readonly mode: "move" | "resize";
  readonly x: number;
  readonly y: number;
  readonly column: number;
  readonly width: number;
  readonly preview: SchedulerEvent;
}

/** The arrow keys that move a booking in time (or, with Shift, resize it), by steps. */
const VERTICAL: Readonly<Record<string, number>> = Object.freeze({ ArrowUp: -1, ArrowDown: 1 });

/** The arrow keys that move a booking to the previous or next column, in reading order. */
const HORIZONTAL: Readonly<Record<string, number>> = Object.freeze({
  ArrowLeft: -1,
  ArrowRight: 1,
});

/** A day or a week of bookings, one column per resource and day. */
export function ResourceScheduler({
  label,
  view,
  days,
  resources,
  startMinute,
  endMinute,
  slotMinutes,
  slotHeight = 24,
  events,
  onEventChange,
  formatMinute,
  formatDay,
  keyboardHint,
}: ResourceSchedulerProps): ReactElement {
  const hintId = useId();
  const { direction } = useLocale();
  const [drag, setDrag] = useState<Drag | null>(null);
  const columnRef = useRef<HTMLDivElement | null>(null);
  const bounds = { startMinute, endMinute, slotMinutes };
  const perMinute = slotHeight / slotMinutes;
  const columns = days.flatMap((day) => resources.map((resource) => ({ day, resource })));
  const columnOf = (event: SchedulerEvent): number =>
    columns.findIndex(
      (column) => column.day === event.day && column.resource.id === event.resource,
    );
  const shown = events.map((event) => (drag?.id === event.id ? drag.preview : event));
  const movable = (event: SchedulerEvent): boolean =>
    onEventChange !== undefined && event.isMovable !== false;

  const propose = (before: SchedulerEvent, after: SchedulerEvent): void => {
    if (
      after.start !== before.start ||
      after.end !== before.end ||
      after.day !== before.day ||
      after.resource !== before.resource
    )
      onEventChange?.(after);
  };

  const begin = (
    event: SchedulerEvent,
    mode: Drag["mode"],
    pointer: PointerEvent<HTMLElement>,
  ): void => {
    if (!movable(event)) return;
    pointer.stopPropagation();
    pointer.currentTarget.setPointerCapture?.(pointer.pointerId);
    setDrag({
      id: event.id,
      mode,
      x: pointer.clientX,
      y: pointer.clientY,
      column: columnOf(event),
      width: columnRef.current?.getBoundingClientRect().width ?? 0,
      preview: event,
    });
  };

  const follow = (event: SchedulerEvent, pointer: PointerEvent<HTMLElement>): void => {
    if (drag?.id !== event.id) return;
    const minutes = (pointer.clientY - drag.y) / perMinute;
    if (drag.mode === "resize") {
      setDrag({ ...drag, preview: resizeEvent(event, minutes, bounds) });
      return;
    }
    const sign = direction === "rtl" ? -1 : 1;
    const shift = drag.width > 0 ? Math.round(((pointer.clientX - drag.x) / drag.width) * sign) : 0;
    const target = columns[Math.min(Math.max(drag.column + shift, 0), columns.length - 1)];
    setDrag({
      ...drag,
      preview: moveEvent(
        event,
        minutes,
        bounds,
        target && { day: target.day, resource: target.resource.id },
      ),
    });
  };

  const finish = (event: SchedulerEvent): void => {
    if (drag?.id !== event.id) return;
    propose(event, drag.preview);
    setDrag(null);
  };

  const press = (event: SchedulerEvent, key: KeyboardEvent<HTMLElement>): void => {
    if (!movable(event)) return;
    const vertical = VERTICAL[key.key];
    const horizontal = HORIZONTAL[key.key];
    let next: SchedulerEvent | undefined;
    if (vertical !== undefined)
      next = key.shiftKey
        ? resizeEvent(event, vertical * slotMinutes, bounds)
        : moveEvent(event, vertical * slotMinutes, bounds);
    else if (horizontal !== undefined) {
      const target = columns[columnOf(event) + horizontal * (direction === "rtl" ? -1 : 1)];
      if (target !== undefined)
        next = moveEvent(event, 0, bounds, { day: target.day, resource: target.resource.id });
    }
    if (next === undefined) return;
    key.preventDefault();
    propose(event, next);
  };

  const hours: number[] = [];
  for (let minute = startMinute; minute < endMinute; minute += slotMinutes)
    if (minute % 60 === 0 || minute === startMinute) hours.push(minute);

  return (
    <div
      data-slot="resource-scheduler"
      data-view={view}
      role="group"
      aria-label={label}
      className="flex flex-col"
    >
      <p id={hintId} className="sr-only">
        {keyboardHint}
      </p>
      <div className="flex">
        <div className="w-14 shrink-0" aria-hidden="true" />
        {columns.map(({ day, resource }) => (
          <div
            key={`${day}:${resource.id}`}
            className="min-w-0 flex-1 truncate px-1 text-center text-xs font-medium"
          >
            {view === "week" ? <span className="block text-muted">{formatDay(day)}</span> : null}
            {resource.label}
          </div>
        ))}
      </div>
      <div className="flex">
        <div
          className="relative w-14 shrink-0"
          style={{ height: (endMinute - startMinute) * perMinute }}
          aria-hidden="true"
        >
          {hours.map((minute) => (
            <span
              key={minute}
              className="absolute end-1 text-[10px] text-muted"
              style={{ top: (minute - startMinute) * perMinute }}
            >
              {formatMinute(minute)}
            </span>
          ))}
        </div>
        {columns.map(({ day, resource }, index) => {
          const mine = shown.filter((event) => event.day === day && event.resource === resource.id);
          const lanes = eventLanes(mine);
          return (
            <div
              key={`${day}:${resource.id}`}
              ref={index === 0 ? columnRef : undefined}
              role="list"
              aria-label={`${resource.labelText}, ${formatDay(day)}`}
              data-column={`${day}:${resource.id}`}
              className="relative min-w-0 flex-1 border-s border-separator"
              style={{ height: (endMinute - startMinute) * perMinute }}
            >
              {mine.map((event) => {
                const lane = lanes.get(event.id) ?? { lane: 0, lanes: 1 };
                const original = events.find((each) => each.id === event.id) ?? event;
                return (
                  <div
                    key={event.id}
                    role="listitem"
                    className="absolute p-px"
                    style={{
                      top: (event.start - startMinute) * perMinute,
                      height: (event.end - event.start) * perMinute,
                      insetInlineStart: `${(lane.lane / lane.lanes) * 100}%`,
                      width: `${100 / lane.lanes}%`,
                    }}
                  >
                    <button
                      type="button"
                      data-event={event.id}
                      data-dragging={drag?.id === event.id || undefined}
                      aria-label={`${event.title}, ${resource.labelText}, ${formatDay(event.day)} ${formatMinute(event.start)} – ${formatMinute(event.end)}`}
                      aria-describedby={hintId}
                      aria-disabled={!movable(event) || undefined}
                      className="relative h-full w-full touch-none overflow-hidden rounded-md bg-accent-soft text-start text-xs text-accent-soft-foreground"
                      onPointerDown={(pointer) => begin(original, "move", pointer)}
                      onPointerMove={(pointer) => follow(original, pointer)}
                      onPointerUp={() => finish(original)}
                      onPointerCancel={() => setDrag(null)}
                      onKeyDown={(key) => press(original, key)}
                    >
                      {(event.segments ?? [])
                        .filter((segment) => segment.kind === "processing")
                        .map((segment) => (
                          <span
                            key={segment.offset}
                            data-segment="processing"
                            aria-hidden="true"
                            className="absolute inset-x-0 bg-background/60"
                            style={{
                              top: segment.offset * perMinute,
                              height: segment.duration * perMinute,
                            }}
                          />
                        ))}
                      <span className="relative block truncate px-1">{event.title}</span>
                      {movable(event) ? (
                        <span
                          data-slot="resize-handle"
                          aria-hidden="true"
                          className="absolute inset-x-0 bottom-0 h-1.5 cursor-ns-resize"
                          onPointerDown={(pointer) => begin(original, "resize", pointer)}
                        />
                      ) : null}
                    </button>
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}
