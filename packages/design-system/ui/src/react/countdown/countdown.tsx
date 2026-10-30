/**
 * Stackra file contract:
 * Purpose: the web `Countdown`: a countdown to `to` or a stopwatch from `from`, as days (when there are any) and
 *          hh:mm:ss in tabular digits of the customer's numbering, ticking once a second.
 * Boundary: a `timer` named by `label`; the ticking digits are not announced, but a polite, visually hidden line says
 *           the time in words once a minute and "Time is up" at the end. The clock keeps left-to-right digit order in
 *           Arabic (`<bdi dir="ltr">`); nothing moves, so the motion setting has nothing to reduce.
 * Runtime: browser
 * Governing contract: ADR 0302 (decision 3); ADR 0192 (digits); WCAG 2.2 SC 2.2.2 and 4.1.3; STA-1371.
 */
import { cn } from "@heroui/react";
import { use, type ReactElement } from "react";

import { DISPLAY_KEYS } from "#core/constants/display-keys.constant";
import { clockPartsOf } from "#core/functions/clock-parts-of.function";
import { spokenDurationOf } from "#core/functions/spoken-duration-of.function";
import type { CountdownProps } from "#react/countdown/countdown.props";
import { DesignSystemContext } from "#react/design-system-provider/design-system-context";
import { useClock } from "#react/hooks/use-clock";
import { useNumberFormat } from "#react/hooks/use-number-format";
import { useUiText } from "#react/hooks/use-ui-text";

/** The countdown's keys. */
const K = DISPLAY_KEYS.ui.countdown;

/** A countdown or a stopwatch. */
export function Countdown(props: CountdownProps): ReactElement {
  const { mode = "countdown", label, className } = props;
  const t = useUiText();
  const format = useNumberFormat();
  const locale = use(DesignSystemContext)?.locale ?? "en";
  const ms = useClock(props);
  const parts = clockPartsOf(ms);
  const two = (value: number) => format(value, { minimumIntegerDigits: 2, useGrouping: false });
  const isDone = mode === "countdown" && ms === 0;
  // Said once a minute: the words change only when the minutes do.
  const spoken = isDone
    ? t(K.done)
    : t(mode === "countdown" ? K.left : K.elapsed, {
        time: spokenDurationOf({ ...parts, seconds: 0 }, format, locale),
      });
  return (
    <div
      role="timer"
      aria-label={label}
      data-slot="countdown"
      className={cn("grid gap-1", className)}
    >
      <span aria-hidden className="text-xs font-medium text-muted">
        {label}
      </span>
      <span aria-hidden className="flex items-baseline gap-2 text-2xl font-semibold tabular-nums">
        {parts.days > 0 ? (
          <span>{format(parts.days, { style: "unit", unit: "day", unitDisplay: "narrow" })}</span>
        ) : null}
        <bdi dir="ltr">{`${two(parts.hours)}:${two(parts.minutes)}:${two(parts.seconds)}`}</bdi>
      </span>
      <span aria-live="polite" className="sr-only">
        {spoken}
      </span>
    </div>
  );
}
