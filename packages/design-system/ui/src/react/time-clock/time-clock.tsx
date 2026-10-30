/**
 * Stackra file contract:
 * Purpose: the web `TimeClock`: a time of day picked on an analogue face. The time above it names the hours and the
 *          minutes (press one to set it) and, in a 12-hour cycle, AM and PM. The face is a `slider` per view that
 *          speaks the whole time ("3:45 PM"): a press or drag picks the nearest hour (24-hour: the inner ring is 00
 *          and 13 to 23) or minute step, and letting go on the hours moves to the minutes. Keys: arrows one step,
 *          Page Up/Down three hours or a quarter hour, Enter or Tab from the hours to the minutes, Shift+Tab back.
 * Boundary: SVG in theme colours; numerals in the customer's digits through `clockFaceOf`. The face is never mirrored
 *           (clocks run clockwise in Arabic too) and the time above reads hours then minutes, left to right, as clocks
 *           do everywhere. Nothing animates.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); WAI-ARIA APG slider; WCAG 2.2 SC 2.1.1, 2.5.7 and 4.1.2; STA-1371 (wave
 *          D, owner approval 2026-10-30).
 */
import { cn } from "@heroui/react";
import { useNumerals } from "@stackra/i18n/react";
import { useState, type KeyboardEvent, type PointerEvent, type ReactElement } from "react";
import { useLocale } from "react-aria-components";

import type { ClockView } from "#contracts/types/clock-view.type";
import { FORMS_KEYS } from "#core/constants/forms-keys.constant";
import { angleOfPoint } from "#core/functions/angle-of-point.function";
import { clockFaceOf } from "#core/functions/clock-face-of.function";
import { clockTimeTextOf } from "#core/functions/clock-time-text-of.function";
import { dayPeriodsOf } from "#core/functions/day-periods-of.function";
import { hourCycleOf } from "#core/functions/hour-cycle-of.function";
import { stepClockTime } from "#core/functions/step-clock-time.function";
import { timeOfClockAngle } from "#core/functions/time-of-clock-angle.function";
import { useNumberFormat } from "#react/hooks/use-number-format";
import { useUiText } from "#react/hooks/use-ui-text";
import type { TimeClockProps } from "#react/time-clock/time-clock.props";

/** The drawing box, the numeral rings and the knob's radius, in its units. */
const BOX = 200;
const OUTER = 80;
const INNER = 52;
const KNOB = 16;

/** A point at `angle` degrees clockwise from the top, at `reach` from the centre. */
const pointAt = (angle: number, reach: number) => {
  const radians = (angle * Math.PI) / 180;
  return { x: BOX / 2 + reach * Math.sin(radians), y: BOX / 2 - reach * Math.cos(radians) };
};

/** A length in drawing units as a share of the face. */
const share = (units: number) => `${(units / BOX) * 100}%`;

/** The face's point as a position on it; the face is a clock, so it does not mirror in right-to-left. */
const at = (point: { x: number; y: number }) => ({ left: share(point.x), top: share(point.y) });

/** The header buttons' corners, from the theme's control radius. */
const CONTROL_RADIUS = { borderRadius: "var(--radius-control)" } as const;

/** A header button's look: large digits, the active view in the accent's soft colour. */
const PART =
  "px-2 py-1 tabular-nums outline-none focus-visible:ring-2 focus-visible:ring-focus disabled:cursor-default";

/** A time of day on a clock face. */
export function TimeClock({
  value,
  defaultValue,
  onChange,
  minuteStep = 1,
  hourCycle,
  label,
  isDisabled = false,
  className,
}: TimeClockProps): ReactElement {
  const { locale } = useLocale();
  const numerals = useNumerals();
  const format = useNumberFormat();
  const t = useUiText();
  const K = FORMS_KEYS.ui.wheel;
  const cycle = hourCycle ?? hourCycleOf(locale);
  const [view, setView] = useState<ClockView>("hours");
  const [own, setOwn] = useState(() => defaultValue ?? { hour: 12, minute: 0 });
  const time = value ?? own;
  const change = (next: typeof time) => {
    if (next.hour === time.hour && next.minute === time.minute) return;
    if (value === undefined) setOwn(next);
    onChange?.(next);
  };
  const face = clockFaceOf(time, view, cycle, format);
  const knob = pointAt(face.hand.angle, face.hand.isInner ? INNER : OUTER);
  const periods = dayPeriodsOf(locale);
  const isPm = time.hour >= 12;
  const two = { minimumIntegerDigits: 2, useGrouping: false } as const;
  const hourText =
    cycle === 12 ? format(time.hour % 12 === 0 ? 12 : time.hour % 12) : format(time.hour, two);

  const pointTo = (event: PointerEvent<HTMLDivElement>) => {
    const box = event.currentTarget.getBoundingClientRect();
    const scale = BOX / box.width;
    const dx = (event.clientX - box.left) * scale - BOX / 2;
    const dy = (event.clientY - box.top) * scale - BOX / 2;
    const isInner = cycle === 24 && Math.hypot(dx, dy) < (OUTER + INNER) / 2;
    change(
      timeOfClockAngle(angleOfPoint(dx, dy), {
        view,
        value: time,
        hourCycle: cycle,
        isInner,
        minuteStep,
      }),
    );
  };
  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const large = view === "hours" ? 3 : Math.max(1, Math.round(15 / minuteStep));
    const steps: Readonly<Record<string, number>> = {
      ArrowUp: 1,
      ArrowRight: 1,
      ArrowDown: -1,
      ArrowLeft: -1,
      PageUp: large,
      PageDown: -large,
    };
    const by = steps[event.key];
    if (by !== undefined) {
      event.preventDefault();
      change(stepClockTime(time, view, by, minuteStep));
      return;
    }
    const isForward = event.key === "Enter" || (event.key === "Tab" && !event.shiftKey);
    if (view === "hours" && isForward) {
      event.preventDefault();
      setView("minutes");
    } else if (view === "minutes" && event.key === "Tab" && event.shiftKey) {
      event.preventDefault();
      setView("hours");
    }
  };

  return (
    <div
      role="group"
      aria-label={label}
      data-slot="time-clock"
      className={cn(
        "inline-flex flex-col items-center gap-3",
        isDisabled && "opacity-50",
        className,
      )}
    >
      {label ? <span className="text-sm font-medium">{label}</span> : null}
      <div dir="ltr" className="flex items-center gap-1 text-3xl font-semibold">
        {(["hours", "minutes"] as const).map((part, index) => (
          <span key={part} className="flex items-center gap-1">
            {index === 1 ? <span aria-hidden="true">:</span> : null}
            <button
              type="button"
              aria-pressed={view === part}
              disabled={isDisabled}
              onClick={() => setView(part)}
              style={CONTROL_RADIUS}
              className={cn(
                PART,
                view === part ? "bg-accent-soft text-accent-soft-foreground" : "text-muted",
              )}
            >
              {/* The name is "Hour 3": the part, then the shown value (WCAG 2.5.3, label in name). */}
              <span className="sr-only">{t(part === "hours" ? K.hour : K.minute)} </span>
              {part === "hours" ? hourText : format(time.minute, two)}
            </button>
          </span>
        ))}
        {cycle === 12 ? (
          <span
            role="group"
            aria-label={t(K.period)}
            className="ms-2 flex flex-col gap-0.5 text-sm"
          >
            {periods.map((period, index) => {
              const isOn = isPm === (index === 1);
              return (
                <button
                  key={period}
                  type="button"
                  aria-pressed={isOn}
                  disabled={isDisabled}
                  onClick={() =>
                    change({ hour: (time.hour % 12) + (index === 1 ? 12 : 0), minute: time.minute })
                  }
                  style={CONTROL_RADIUS}
                  className={cn(
                    PART,
                    "px-1.5 py-0.5",
                    isOn ? "bg-accent-soft text-accent-soft-foreground" : "text-muted",
                  )}
                >
                  {period}
                </button>
              );
            })}
          </span>
        ) : null}
      </div>
      <div
        role="slider"
        tabIndex={isDisabled ? -1 : 0}
        aria-label={t(view === "hours" ? K.hour : K.minute)}
        aria-valuemin={0}
        aria-valuemax={view === "hours" ? 23 : 59}
        aria-valuenow={view === "hours" ? time.hour : time.minute}
        aria-valuetext={clockTimeTextOf(time, locale, cycle, numerals)}
        aria-disabled={isDisabled || undefined}
        data-slot="time-clock-face"
        style={{ borderRadius: "var(--radius-full)" }}
        className={cn(
          "relative size-64 touch-none select-none bg-default outline-none focus-visible:ring-2 focus-visible:ring-focus",
          !isDisabled && "cursor-pointer",
        )}
        onKeyDown={isDisabled ? undefined : onKeyDown}
        onPointerDown={(event) => {
          if (isDisabled || event.button !== 0) return;
          event.currentTarget.setPointerCapture(event.pointerId);
          event.currentTarget.focus({ preventScroll: true });
          event.preventDefault();
          pointTo(event);
        }}
        onPointerMove={(event) => {
          if (event.currentTarget.hasPointerCapture(event.pointerId)) pointTo(event);
        }}
        onPointerUp={(event) => {
          if (!event.currentTarget.hasPointerCapture(event.pointerId)) return;
          event.currentTarget.releasePointerCapture(event.pointerId);
          if (view === "hours") setView("minutes");
        }}
      >
        {/* The face is HTML, not SVG, so its colours and backgrounds are CSS that contrast checks can measure (an SVG
            fill, or text under an SVG layer, is unreadable to them). The hand turns from the centre, 0° at the top. */}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute h-0.5 bg-accent"
          style={{
            ...at({ x: BOX / 2, y: BOX / 2 }),
            width: share(face.hand.isInner ? INNER : OUTER),
            transformOrigin: "0 50%",
            transform: `translateY(-50%) rotate(${face.hand.angle - 90}deg)`,
          }}
        />
        <span
          aria-hidden="true"
          className="pointer-events-none absolute size-1.5 -translate-x-1/2 -translate-y-1/2 bg-accent"
          style={{ ...at({ x: BOX / 2, y: BOX / 2 }), borderRadius: "var(--radius-full)" }}
        />
        <span
          aria-hidden="true"
          className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 bg-accent"
          style={{
            ...at(knob),
            width: share(KNOB * 2),
            height: share(KNOB * 2),
            borderRadius: "var(--radius-full)",
          }}
        />
        {face.numerals.map((numeral) => (
          <span
            key={`${numeral.isInner ? "inner" : "outer"}-${numeral.angle}`}
            aria-hidden="true"
            className={cn(
              "pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 leading-none tabular-nums",
              numeral.isInner ? "text-sm" : "text-lg",
              numeral.isSelected
                ? "text-accent-foreground"
                : numeral.isInner
                  ? "text-muted"
                  : "text-foreground",
            )}
            style={at(pointAt(numeral.angle, numeral.isInner ? INNER : OUTER))}
          >
            {numeral.text}
          </span>
        ))}
      </div>
    </div>
  );
}
